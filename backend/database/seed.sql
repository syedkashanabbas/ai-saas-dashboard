-- Seed data for AI SaaS Dashboard
USE ai_saas_dashboard;

-- Insert default tenant (8Solve AI)
INSERT INTO tenants (name, slug, email, phone, address, status, subscription_plan) VALUES
('8Solve AI', '8solve-ai', 'admin@8solve.ai', '+1-555-0123', '123 Tech Street, Silicon Valley, CA 94000', 'active', 'enterprise');

-- Insert Super Admin user (password: admin123)
-- Note: In production, this should be created through a secure setup process
INSERT INTO users (tenant_id, role_id, email, password, first_name, last_name, status, email_verified) VALUES
(NULL, 1, 'superadmin@8solve.ai', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super', 'Admin', 'active', TRUE);

-- Insert sample tenant admin (password: admin123)
INSERT INTO users (tenant_id, role_id, email, password, first_name, last_name, status, email_verified) VALUES
(1, 2, 'admin@8solve.ai', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', 'active', TRUE);

-- Insert sample manager (password: manager123)
INSERT INTO users (tenant_id, role_id, email, password, first_name, last_name, status, email_verified) VALUES
(1, 3, 'manager@8solve.ai', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', 'active', TRUE);

-- Insert sample user (password: user123)
INSERT INTO users (tenant_id, role_id, email, password, first_name, last_name, status, email_verified) VALUES
(1, 4, 'user@8solve.ai', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob', 'Johnson', 'active', TRUE);

-- Insert sample notifications
INSERT INTO notifications (user_id, tenant_id, title, message, type, created_by) VALUES
(2, 1, 'Welcome to 8Solve AI', 'Welcome to your new AI SaaS dashboard! Explore the features and get started.', 'info', 1),
(3, 1, 'Team Meeting Scheduled', 'Weekly team meeting scheduled for Friday at 2 PM.', 'info', 2),
(4, 1, 'Profile Update Required', 'Please update your profile information to complete your setup.', 'warning', 2),
(2, 1, 'System Maintenance', 'Scheduled maintenance will occur this weekend from 2-4 AM.', 'warning', 1);

-- Insert sample unread notifications
INSERT INTO notifications (user_id, tenant_id, title, message, type, is_read, created_by) VALUES
(3, 1, 'New Feature Available', 'Check out our new analytics dashboard feature!', 'success', FALSE, 1),
(4, 1, 'Action Required', 'Please review and approve the pending requests.', 'warning', FALSE, 2);

