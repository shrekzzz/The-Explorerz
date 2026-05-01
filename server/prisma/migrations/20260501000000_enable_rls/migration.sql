-- ════════════════════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY (RLS) IMPLEMENTATION
-- ════════════════════════════════════════════════════════════════════════════
-- This migration implements database-level security policies to ensure that
-- even if application-level auth is bypassed, users can only access their own data.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Step 1: Create function to get current user ID ────────────────────────
-- This function retrieves the user ID from the current database session.
-- The application must set this using: SET LOCAL app.current_user_id = 'uuid';

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── Step 2: Create function to check if user is admin ─────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.user_role', TRUE) IN ('ADMIN', 'SUPERADMIN'),
    FALSE
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── Step 3: Create function to check if user is staff or above ────────────

CREATE OR REPLACE FUNCTION is_staff_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.user_role', TRUE) IN ('STAFF', 'ADMIN', 'SUPERADMIN'),
    FALSE
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════════════
-- ENABLE ROW-LEVEL SECURITY ON ALL TABLES
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════════════════
-- USERS TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Users can view their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = current_user_id());

-- Admins can view all users
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  USING (is_admin());

-- Users can update their own profile (except role and isActive)
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = current_user_id())
  WITH CHECK (
    id = current_user_id() AND
    role = (SELECT role FROM users WHERE id = current_user_id()) AND
    is_active = (SELECT is_active FROM users WHERE id = current_user_id())
  );

-- Admins can update any user
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  USING (is_admin());

-- Only system can insert users (during registration)
-- This policy allows INSERT when no user context is set (registration flow)
CREATE POLICY "users_insert_system"
  ON users FOR INSERT
  WITH CHECK (current_user_id() IS NULL OR is_admin());

-- Admins can delete users
CREATE POLICY "users_delete_admin"
  ON users FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- SESSIONS TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Users can view their own sessions
CREATE POLICY "sessions_select_own"
  ON sessions FOR SELECT
  USING (user_id = current_user_id());

-- Admins can view all sessions
CREATE POLICY "sessions_select_admin"
  ON sessions FOR SELECT
  USING (is_admin());

-- System can insert sessions (during login)
CREATE POLICY "sessions_insert_system"
  ON sessions FOR INSERT
  WITH CHECK (current_user_id() IS NULL OR user_id = current_user_id());

-- Users can delete their own sessions (logout)
CREATE POLICY "sessions_delete_own"
  ON sessions FOR DELETE
  USING (user_id = current_user_id());

-- Admins can delete any session
CREATE POLICY "sessions_delete_admin"
  ON sessions FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- PACKAGES TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Everyone can view available packages (public data)
CREATE POLICY "packages_select_all"
  ON packages FOR SELECT
  USING (status = 'AVAILABLE' OR is_staff_or_above());

-- Staff and above can insert packages
CREATE POLICY "packages_insert_staff"
  ON packages FOR INSERT
  WITH CHECK (is_staff_or_above());

-- Staff can update their own packages, admins can update all
CREATE POLICY "packages_update_staff"
  ON packages FOR UPDATE
  USING (
    is_admin() OR 
    (is_staff_or_above() AND created_by = current_user_id())
  );

-- Admins can delete packages
CREATE POLICY "packages_delete_admin"
  ON packages FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- PACKAGE_IMAGES TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Everyone can view package images (public data)
CREATE POLICY "package_images_select_all"
  ON package_images FOR SELECT
  USING (TRUE);

-- Staff and above can insert package images
CREATE POLICY "package_images_insert_staff"
  ON package_images FOR INSERT
  WITH CHECK (is_staff_or_above());

-- Staff and above can update package images
CREATE POLICY "package_images_update_staff"
  ON package_images FOR UPDATE
  USING (is_staff_or_above());

-- Staff and above can delete package images
CREATE POLICY "package_images_delete_staff"
  ON package_images FOR DELETE
  USING (is_staff_or_above());

-- ════════════════════════════════════════════════════════════════════════════
-- TRIPS TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Users can view their own trips
CREATE POLICY "trips_select_own"
  ON trips FOR SELECT
  USING (user_id = current_user_id());

-- Anyone can view public trips (shared via token)
CREATE POLICY "trips_select_public"
  ON trips FOR SELECT
  USING (is_public = TRUE);

-- Admins can view all trips
CREATE POLICY "trips_select_admin"
  ON trips FOR SELECT
  USING (is_admin());

-- Users can insert their own trips
CREATE POLICY "trips_insert_own"
  ON trips FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can update their own trips
CREATE POLICY "trips_update_own"
  ON trips FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Users can delete their own trips
CREATE POLICY "trips_delete_own"
  ON trips FOR DELETE
  USING (user_id = current_user_id());

-- Admins can delete any trip
CREATE POLICY "trips_delete_admin"
  ON trips FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- ITINERARY_DAYS TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Users can view itinerary days for their own trips or public trips
CREATE POLICY "itinerary_days_select"
  ON itinerary_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = itinerary_days.trip_id 
      AND (trips.user_id = current_user_id() OR trips.is_public = TRUE)
    ) OR is_admin()
  );

-- Users can insert itinerary days for their own trips
CREATE POLICY "itinerary_days_insert"
  ON itinerary_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = itinerary_days.trip_id 
      AND trips.user_id = current_user_id()
    )
  );

-- Users can update itinerary days for their own trips
CREATE POLICY "itinerary_days_update"
  ON itinerary_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = itinerary_days.trip_id 
      AND trips.user_id = current_user_id()
    )
  );

-- Users can delete itinerary days for their own trips
CREATE POLICY "itinerary_days_delete"
  ON itinerary_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = itinerary_days.trip_id 
      AND trips.user_id = current_user_id()
    ) OR is_admin()
  );

-- ════════════════════════════════════════════════════════════════════════════
-- ACTIVITIES TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Users can view activities for their own trips or public trips
CREATE POLICY "activities_select"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_days 
      JOIN trips ON trips.id = itinerary_days.trip_id
      WHERE itinerary_days.id = activities.itinerary_day_id 
      AND (trips.user_id = current_user_id() OR trips.is_public = TRUE)
    ) OR is_admin()
  );

-- Users can insert activities for their own trips
CREATE POLICY "activities_insert"
  ON activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM itinerary_days 
      JOIN trips ON trips.id = itinerary_days.trip_id
      WHERE itinerary_days.id = activities.itinerary_day_id 
      AND trips.user_id = current_user_id()
    )
  );

-- Users can update activities for their own trips
CREATE POLICY "activities_update"
  ON activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_days 
      JOIN trips ON trips.id = itinerary_days.trip_id
      WHERE itinerary_days.id = activities.itinerary_day_id 
      AND trips.user_id = current_user_id()
    )
  );

-- Users can delete activities for their own trips
CREATE POLICY "activities_delete"
  ON activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_days 
      JOIN trips ON trips.id = itinerary_days.trip_id
      WHERE itinerary_days.id = activities.itinerary_day_id 
      AND trips.user_id = current_user_id()
    ) OR is_admin()
  );

-- ════════════════════════════════════════════════════════════════════════════
-- TRIP_HOTELS TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Users can view hotels for their own trips or public trips
CREATE POLICY "trip_hotels_select"
  ON trip_hotels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_hotels.trip_id 
      AND (trips.user_id = current_user_id() OR trips.is_public = TRUE)
    ) OR is_admin()
  );

-- Users can insert hotels for their own trips
CREATE POLICY "trip_hotels_insert"
  ON trip_hotels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_hotels.trip_id 
      AND trips.user_id = current_user_id()
    )
  );

-- Users can update hotels for their own trips
CREATE POLICY "trip_hotels_update"
  ON trip_hotels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_hotels.trip_id 
      AND trips.user_id = current_user_id()
    )
  );

-- Users can delete hotels for their own trips
CREATE POLICY "trip_hotels_delete"
  ON trip_hotels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = trip_hotels.trip_id 
      AND trips.user_id = current_user_id()
    ) OR is_admin()
  );

-- ════════════════════════════════════════════════════════════════════════════
-- BOOKINGS TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Users can view their own bookings
CREATE POLICY "bookings_select_own"
  ON bookings FOR SELECT
  USING (user_id = current_user_id());

-- Staff and above can view all bookings
CREATE POLICY "bookings_select_staff"
  ON bookings FOR SELECT
  USING (is_staff_or_above());

-- Users can insert their own bookings
CREATE POLICY "bookings_insert_own"
  ON bookings FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can update their own bookings (limited fields)
CREATE POLICY "bookings_update_own"
  ON bookings FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Staff and above can update any booking
CREATE POLICY "bookings_update_staff"
  ON bookings FOR UPDATE
  USING (is_staff_or_above());

-- Users can delete their own pending bookings
CREATE POLICY "bookings_delete_own"
  ON bookings FOR DELETE
  USING (user_id = current_user_id() AND status = 'PENDING');

-- Admins can delete any booking
CREATE POLICY "bookings_delete_admin"
  ON bookings FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- REVIEWS TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Everyone can view reviews (public data)
CREATE POLICY "reviews_select_all"
  ON reviews FOR SELECT
  USING (TRUE);

-- Users can insert their own reviews
CREATE POLICY "reviews_insert_own"
  ON reviews FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- Users can update their own reviews
CREATE POLICY "reviews_update_own"
  ON reviews FOR UPDATE
  USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- Users can delete their own reviews
CREATE POLICY "reviews_delete_own"
  ON reviews FOR DELETE
  USING (user_id = current_user_id());

-- Admins can delete any review
CREATE POLICY "reviews_delete_admin"
  ON reviews FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- AUDIT_LOGS TABLE POLICIES
-- ════════════════════════════════════════════════════════════════════════════

-- Only admins can view audit logs
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  USING (is_admin());

-- System can insert audit logs
CREATE POLICY "audit_logs_insert_system"
  ON audit_logs FOR INSERT
  WITH CHECK (TRUE);

-- No one can update audit logs (immutable)
-- No policy needed - will be denied by default

-- Only superadmins can delete audit logs (for GDPR compliance)
CREATE POLICY "audit_logs_delete_superadmin"
  ON audit_logs FOR DELETE
  USING (current_setting('app.user_role', TRUE) = 'SUPERADMIN');

-- ════════════════════════════════════════════════════════════════════════════
-- GRANT NECESSARY PERMISSIONS
-- ════════════════════════════════════════════════════════════════════════════

-- Grant execute permission on helper functions to the application user
-- Replace 'your_app_user' with your actual database user
-- GRANT EXECUTE ON FUNCTION current_user_id() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION is_admin() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION is_staff_or_above() TO your_app_user;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run these to test RLS)
-- ════════════════════════════════════════════════════════════════════════════

-- Test 1: Set a user context and verify they can only see their own data
-- SET LOCAL app.current_user_id = 'some-user-uuid';
-- SET LOCAL app.user_role = 'USER';
-- SELECT * FROM trips; -- Should only return trips for this user

-- Test 2: Set admin context and verify they can see all data
-- SET LOCAL app.current_user_id = 'admin-user-uuid';
-- SET LOCAL app.user_role = 'ADMIN';
-- SELECT * FROM trips; -- Should return all trips

-- Test 3: Clear context and verify no data is accessible
-- RESET app.current_user_id;
-- RESET app.user_role;
-- SELECT * FROM trips; -- Should return empty (except public trips)
