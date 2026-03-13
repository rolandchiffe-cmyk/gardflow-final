import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COMMUNES_GARD_RHODANIEN = [
  "aiguèze", "bagnols-sur-cèze", "bagnols sur cèze", "carsan", "cavillargues",
  "chusclan", "codolet", "connaux", "cornillon", "gaujac", "goudargues",
  "issirac", "la roque-sur-cèze", "la roque sur cèze", "laudun-l'ardoise",
  "laudun", "l'ardoise", "laval-saint-roman", "laval saint roman",
  "le garn", "le pin", "lirac", "montclus", "montfaucon", "orsan",
  "pont-saint-esprit", "pont saint esprit", "sabran", "saint-alexandre",
  "saint-andré d'olérargues", "saint-andré de roquepertuis",
  "saint-christol de rodières", "saint-etienne des sorts",
  "saint-geniès de comolas", "saint-gervais", "saint-julien de peyrolas",
  "saint-laurent de carnols", "saint-laurent des arbres",
  "saint-marcel de careiret", "saint-michel d'euzet", "saint-nazaire",
  "saint-paul-les-fonts", "saint-paulet de caisson", "saint-pons la calm",
  "saint-victor-la-coste", "salazac", "tavel", "tresques", "vénéjan",
  "verfeuil", "gard rhodanien", "gard-rhodanien",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const COMMUNES_NORMALIZED = COMMUNES_GARD_RHODANIEN.map(normalize);

function isLocalNews(title: string, description: string): boolean {
  const text = normalize(`${title} ${description}`);
  return COMMUNES_NORMALIZED.some((commune) => text.includes(commune));
}

function parseRSS(xml: string, feedId: string): Array<{
  feed_id: string;
  title: string;
  description: string;
  url: string;
  image_url: string;
  published_at: string | null;
  guid: string;
  is_local: boolean;
}> {
  const items: ReturnType<typeof parseRSS> = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const item = match[1];

    const title = (item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) ?? [])[1]?.trim() ?? "";
    const link =
      (item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/) ?? [])[1]?.trim() ??
      (item.match(/<link\s+href="([^"]+)"/) ?? [])[1]?.trim() ??
      "";
    const desc =
      (item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) ?? [])[1]?.trim() ?? "";
    const pubDate =
      (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) ?? [])[1]?.trim() ??
      (item.match(/<dc:date>([\s\S]*?)<\/dc:date>/) ?? [])[1]?.trim() ??
      null;
    const guid =
      (item.match(/<guid[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/) ?? [])[1]?.trim() ?? link;

    const enclosureUrl = (item.match(/<enclosure[^>]+url="([^"]+)"/) ?? [])[1]?.trim() ?? "";
    const mediaUrl = (item.match(/<media:content[^>]+url="([^"]+)"/) ?? [])[1]?.trim() ?? "";
    const imgInDesc = (desc.match(/<img[^>]+src="([^"]+)"/) ?? [])[1]?.trim() ?? "";
    const image_url = enclosureUrl || mediaUrl || imgInDesc;

    const cleanDesc = desc
      .replace(/<!\[CDATA\[/g, "")
      .replace(/\]\]>/g, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<p[^>]*>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 400);

    if (title && (link || guid)) {
      items.push({
        feed_id: feedId,
        title,
        description: cleanDesc,
        url: link,
        image_url,
        published_at: pubDate ? new Date(pubDate).toISOString() : null,
        guid: guid || link,
        is_local: isLocalNews(title, cleanDesc),
      });
    }
  }

  return items;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: feeds, error: feedsError } = await supabase
      .from("rss_feeds")
      .select("id, url, title")
      .eq("is_active", true);

    if (feedsError) throw feedsError;
    if (!feeds || feeds.length === 0) {
      return new Response(JSON.stringify({ message: "No active feeds", fetched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalInserted = 0;
    const errors: string[] = [];

    for (const feed of feeds) {
      try {
        const resp = await fetch(feed.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; GardFlow/1.0; +https://gardflow.fr)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
          },
          signal: AbortSignal.timeout(15000),
        });
        if (!resp.ok) {
          errors.push(`Feed ${feed.title}: HTTP ${resp.status}`);
          continue;
        }
        const xml = await resp.text();
        const items = parseRSS(xml, feed.id);

        if (items.length > 0) {
          const { error: insertError } = await supabase
            .from("news_items")
            .upsert(items, { onConflict: "feed_id,guid", ignoreDuplicates: true });

          if (insertError) {
            errors.push(`Feed ${feed.title}: ${insertError.message}`);
          } else {
            totalInserted += items.length;
          }
        }

        await supabase
          .from("rss_feeds")
          .update({ last_fetched_at: new Date().toISOString() })
          .eq("id", feed.id);
      } catch (e) {
        errors.push(`Feed ${feed.title}: ${String(e)}`);
      }
    }

    return new Response(
      JSON.stringify({ message: "RSS fetch complete", fetched: totalInserted, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
