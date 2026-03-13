/*
  # Fix RLS Auth Initialization Plan

  ## Summary
  Replaces all `auth.uid()` calls in RLS policies with `(select auth.uid())`
  to prevent per-row re-evaluation. This significantly improves query performance
  at scale by evaluating the auth function once per query instead of once per row.

  ## Tables fixed
  users, posts, comments, likes, evenements, salons, salon_members, salon_messages,
  annonces, annonce_images, commerces, publicites, associations, messages, notifications,
  signalements, sanctions, event_attendees, volunteer_opportunities, volunteer_signups,
  shares, association_claims, rss_feeds, news_items, commerce_claims, agriculteur_claims
*/

-- users
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- posts
DROP POLICY IF EXISTS "Users can create own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view published posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can update post status" ON public.posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON public.posts;

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view published posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update post status"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "Admins can delete posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

-- comments
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- likes
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

CREATE POLICY "Users can create likes"
  ON public.likes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.likes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- evenements
DROP POLICY IF EXISTS "Users can create evenements" ON public.evenements;
DROP POLICY IF EXISTS "Users can update own evenements" ON public.evenements;

CREATE POLICY "Users can create evenements"
  ON public.evenements FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own evenements"
  ON public.evenements FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- salons
DROP POLICY IF EXISTS "Users can create salons" ON public.salons;
DROP POLICY IF EXISTS "Creators can update own salons" ON public.salons;
DROP POLICY IF EXISTS "Anyone can view approved public salons" ON public.salons;
DROP POLICY IF EXISTS "Admins can view all salons" ON public.salons;
DROP POLICY IF EXISTS "Admins can update salons" ON public.salons;
DROP POLICY IF EXISTS "Users can view active salons" ON public.salons;
DROP POLICY IF EXISTS "Admins can update salon status" ON public.salons;
DROP POLICY IF EXISTS "Admins can delete salons" ON public.salons;

CREATE POLICY "Users can create salons"
  ON public.salons FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Creators can update own salons"
  ON public.salons FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Users can view active salons"
  ON public.salons FOR SELECT
  TO authenticated
  USING (
    status IN ('approved', 'active')
    OR (select auth.uid()) = created_by
    OR EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update salon status"
  ON public.salons FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "Admins can delete salons"
  ON public.salons FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

-- salon_members
DROP POLICY IF EXISTS "Users can join salons" ON public.salon_members;
DROP POLICY IF EXISTS "Users can leave salons" ON public.salon_members;

CREATE POLICY "Users can join salons"
  ON public.salon_members FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can leave salons"
  ON public.salon_members FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- salon_messages
DROP POLICY IF EXISTS "Members can view salon messages" ON public.salon_messages;
DROP POLICY IF EXISTS "Members can send salon messages" ON public.salon_messages;

CREATE POLICY "Members can view salon messages"
  ON public.salon_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.salon_members
      WHERE salon_members.salon_id = salon_messages.salon_id
        AND salon_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Members can send salon messages"
  ON public.salon_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.salon_members
      WHERE salon_members.salon_id = salon_messages.salon_id
        AND salon_members.user_id = (select auth.uid())
    )
  );

-- annonces
DROP POLICY IF EXISTS "Users can create own annonces" ON public.annonces;
DROP POLICY IF EXISTS "Users can update own annonces" ON public.annonces;
DROP POLICY IF EXISTS "Users can delete own annonces" ON public.annonces;

CREATE POLICY "Users can create own annonces"
  ON public.annonces FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own annonces"
  ON public.annonces FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own annonces"
  ON public.annonces FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- annonce_images
DROP POLICY IF EXISTS "Users can add images to own annonces" ON public.annonce_images;

CREATE POLICY "Users can add images to own annonces"
  ON public.annonce_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.annonces
      WHERE annonces.id = annonce_images.annonce_id
        AND annonces.user_id = (select auth.uid())
    )
  );

-- commerces
DROP POLICY IF EXISTS "Users can create commerces" ON public.commerces;
DROP POLICY IF EXISTS "Users can update own commerces" ON public.commerces;

CREATE POLICY "Users can create commerces"
  ON public.commerces FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own commerces"
  ON public.commerces FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- publicites
DROP POLICY IF EXISTS "Commerce owners can manage publicites" ON public.publicites;
DROP POLICY IF EXISTS "Anyone can view active publicites" ON public.publicites;
DROP POLICY IF EXISTS "Users can view active publicites" ON public.publicites;
DROP POLICY IF EXISTS "Admins can update publicite status" ON public.publicites;
DROP POLICY IF EXISTS "Admins can delete publicites" ON public.publicites;

CREATE POLICY "Commerce owners can manage publicites"
  ON public.publicites FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.commerces
      WHERE commerces.id = publicites.commerce_id
        AND commerces.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.commerces
      WHERE commerces.id = publicites.commerce_id
        AND commerces.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can view active publicites"
  ON public.publicites FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    OR EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.commerces
      WHERE commerces.id = publicites.commerce_id
        AND commerces.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update publicite status"
  ON public.publicites FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "Admins can delete publicites"
  ON public.publicites FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

-- associations
DROP POLICY IF EXISTS "Users can create associations" ON public.associations;
DROP POLICY IF EXISTS "Users can update own associations" ON public.associations;

CREATE POLICY "Users can create associations"
  ON public.associations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own associations"
  ON public.associations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;

CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = sender_id);

CREATE POLICY "Users can update messages they received"
  ON public.messages FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = receiver_id)
  WITH CHECK ((select auth.uid()) = receiver_id);

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- signalements
DROP POLICY IF EXISTS "Users can create signalements" ON public.signalements;
DROP POLICY IF EXISTS "Users can view own signalements" ON public.signalements;

CREATE POLICY "Users can create signalements"
  ON public.signalements FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = reporter_id);

CREATE POLICY "Users can view own signalements"
  ON public.signalements FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = reporter_id);

-- sanctions
DROP POLICY IF EXISTS "Users can view own sanctions" ON public.sanctions;

CREATE POLICY "Users can view own sanctions"
  ON public.sanctions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- event_attendees
DROP POLICY IF EXISTS "Users can register for events" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can cancel event registration" ON public.event_attendees;

CREATE POLICY "Users can register for events"
  ON public.event_attendees FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can cancel event registration"
  ON public.event_attendees FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- volunteer_opportunities
DROP POLICY IF EXISTS "Association owners can manage opportunities" ON public.volunteer_opportunities;

CREATE POLICY "Association owners can manage opportunities"
  ON public.volunteer_opportunities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.associations
      WHERE associations.id = volunteer_opportunities.association_id
        AND associations.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.associations
      WHERE associations.id = volunteer_opportunities.association_id
        AND associations.user_id = (select auth.uid())
    )
  );

-- volunteer_signups
DROP POLICY IF EXISTS "Users can sign up as volunteers" ON public.volunteer_signups;
DROP POLICY IF EXISTS "Users can cancel volunteer signups" ON public.volunteer_signups;

CREATE POLICY "Users can sign up as volunteers"
  ON public.volunteer_signups FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can cancel volunteer signups"
  ON public.volunteer_signups FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- shares
DROP POLICY IF EXISTS "Users can share posts" ON public.shares;

CREATE POLICY "Users can share posts"
  ON public.shares FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- association_claims
DROP POLICY IF EXISTS "Users can view own claims" ON public.association_claims;
DROP POLICY IF EXISTS "Authenticated users can submit claims" ON public.association_claims;
DROP POLICY IF EXISTS "Admins can view all claims" ON public.association_claims;
DROP POLICY IF EXISTS "Admins can update claims" ON public.association_claims;

CREATE POLICY "Authenticated users can submit claims"
  ON public.association_claims FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view own claims"
  ON public.association_claims FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update claims"
  ON public.association_claims FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

-- rss_feeds
DROP POLICY IF EXISTS "Admins can read all rss feeds" ON public.rss_feeds;
DROP POLICY IF EXISTS "Admins can insert rss feeds" ON public.rss_feeds;
DROP POLICY IF EXISTS "Admins can update rss feeds" ON public.rss_feeds;
DROP POLICY IF EXISTS "Admins can delete rss feeds" ON public.rss_feeds;

CREATE POLICY "Admins can read all rss feeds"
  ON public.rss_feeds FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can insert rss feeds"
  ON public.rss_feeds FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "Admins can update rss feeds"
  ON public.rss_feeds FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

CREATE POLICY "Admins can delete rss feeds"
  ON public.rss_feeds FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

-- news_items
DROP POLICY IF EXISTS "Service role can insert news items" ON public.news_items;
DROP POLICY IF EXISTS "Service role can delete news items" ON public.news_items;

CREATE POLICY "Service role can insert news items"
  ON public.news_items FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can delete news items"
  ON public.news_items FOR DELETE
  TO service_role
  USING (true);

-- commerce_claims
DROP POLICY IF EXISTS "Authenticated users can submit commerce claims" ON public.commerce_claims;
DROP POLICY IF EXISTS "Users can view own commerce claims" ON public.commerce_claims;
DROP POLICY IF EXISTS "Admins can view all commerce claims" ON public.commerce_claims;
DROP POLICY IF EXISTS "Admins can update commerce claims" ON public.commerce_claims;

CREATE POLICY "Authenticated users can submit commerce claims"
  ON public.commerce_claims FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view own commerce claims"
  ON public.commerce_claims FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update commerce claims"
  ON public.commerce_claims FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));

-- agriculteur_claims
DROP POLICY IF EXISTS "Authenticated users can submit agriculteur claims" ON public.agriculteur_claims;
DROP POLICY IF EXISTS "Users can view own agriculteur claims" ON public.agriculteur_claims;
DROP POLICY IF EXISTS "Admins can view all agriculteur claims" ON public.agriculteur_claims;
DROP POLICY IF EXISTS "Admins can update agriculteur claims" ON public.agriculteur_claims;

CREATE POLICY "Authenticated users can submit agriculteur claims"
  ON public.agriculteur_claims FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view own agriculteur claims"
  ON public.agriculteur_claims FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin')
  );

CREATE POLICY "Admins can update agriculteur claims"
  ON public.agriculteur_claims FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = (select auth.uid()) AND role = 'admin'));
