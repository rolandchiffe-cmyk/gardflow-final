/*
  # Add indexes for all unindexed foreign keys

  ## Summary
  Adds covering indexes on all foreign key columns that were missing indexes.
  This improves JOIN and lookup performance significantly.

  ## Tables affected
  - annonce_images, annonces, associations, comments, commerces, evenements
  - event_attendees, likes, messages, notifications, posts, preinscriptions
  - publicites, salon_members, salon_messages, salons, sanctions, shares
  - signalements, users, volunteer_opportunities, volunteer_signups
*/

CREATE INDEX IF NOT EXISTS idx_annonce_images_annonce_id ON public.annonce_images(annonce_id);

CREATE INDEX IF NOT EXISTS idx_annonces_commune_id ON public.annonces(commune_id);
CREATE INDEX IF NOT EXISTS idx_annonces_user_id ON public.annonces(user_id);

CREATE INDEX IF NOT EXISTS idx_associations_commune_id ON public.associations(commune_id);
CREATE INDEX IF NOT EXISTS idx_associations_user_id ON public.associations(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

CREATE INDEX IF NOT EXISTS idx_commerces_commune_id ON public.commerces(commune_id);
CREATE INDEX IF NOT EXISTS idx_commerces_user_id ON public.commerces(user_id);

CREATE INDEX IF NOT EXISTS idx_evenements_commune_id ON public.evenements(commune_id);
CREATE INDEX IF NOT EXISTS idx_evenements_user_id ON public.evenements(user_id);

CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON public.event_attendees(user_id);

CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_posts_commune_id ON public.posts(commune_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_validated_by ON public.posts(validated_by);

CREATE INDEX IF NOT EXISTS idx_preinscriptions_commune_id ON public.preinscriptions(commune_id);

CREATE INDEX IF NOT EXISTS idx_publicites_commerce_id ON public.publicites(commerce_id);
CREATE INDEX IF NOT EXISTS idx_publicites_validated_by ON public.publicites(validated_by);

CREATE INDEX IF NOT EXISTS idx_salon_members_user_id ON public.salon_members(user_id);

CREATE INDEX IF NOT EXISTS idx_salon_messages_salon_id ON public.salon_messages(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_messages_user_id ON public.salon_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_salons_approved_by ON public.salons(approved_by);
CREATE INDEX IF NOT EXISTS idx_salons_created_by ON public.salons(created_by);
CREATE INDEX IF NOT EXISTS idx_salons_validated_by ON public.salons(validated_by);

CREATE INDEX IF NOT EXISTS idx_sanctions_admin_id ON public.sanctions(admin_id);
CREATE INDEX IF NOT EXISTS idx_sanctions_user_id ON public.sanctions(user_id);

CREATE INDEX IF NOT EXISTS idx_shares_post_id ON public.shares(post_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON public.shares(user_id);

CREATE INDEX IF NOT EXISTS idx_signalements_reported_user_id ON public.signalements(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_signalements_reporter_id ON public.signalements(reporter_id);

CREATE INDEX IF NOT EXISTS idx_users_commune_id ON public.users(commune_id);

CREATE INDEX IF NOT EXISTS idx_volunteer_opportunities_association_id ON public.volunteer_opportunities(association_id);

CREATE INDEX IF NOT EXISTS idx_volunteer_signups_user_id ON public.volunteer_signups(user_id);
