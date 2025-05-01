# Final Project Documentation

## a. Overview / Summary
Brief synopsis of the project, its purpose, and goals.

## b. Wireframe Diagram and Planning Docs

### i. Wireframe Diagram
![Wireframe](path/to/wireframe.png)

### ii. Project Plan

#### 1. Component Breakdown & Order
User Authentication | Registration, Login, Logout, Password Reset, Role Assignment

Navigation Bar | Consistent top nav with conditional links based on role

Registration Forms | Separate forms for NGOs and Volunteers with role-specific fields

Profile Pages

    Own Profile View: Volunteers, NGOs, Admin
    External View: Volunteer (viewed by NGO), NGO (viewed by Volunteer)

Dashboards

    Volunteer Dashboard (browse NGOs, contact)
    NGO Dashboard (browse Volunteers, contact)
    Admin Dashboard (user management)

Message Center | Inbox + conversation window for internal comms

Contact Buttons | Appears on opposite-view profile pages to initiate conversation

Forgot Password | Email-based reset

Access Control Logic | Role-based routing, protected views

About Page | purpose and partnerships

#### 2. Subtasks for Each Component
User Authentication

    Set up user schema (roles: volunteer, NGO, admin)

    Build login, logout, registration

    Implement password hashing + token/session system

    Build Forgot Password (email reset flow)

    Redirect post-login based on role

Navigation Bar

    Build reusable nav component

    Show/hide links based on role (dashboard, profile, messages, admin)

    Ensure logout clears session

Registration Forms

    NGO: org name, contact email, areas of concern

    Volunteer: name, email, weekly hours, background check, resume upload

    Validate & store in DB with appropriate role

Profile Pages

    Volunteer (Own): editable name, email, hours, expertise, resume

    NGO (Own): editable org name, email, concerns

    Admin (Own): editable name/email, display role only

    Viewed Profiles: read-only layout, with contact button

Dashboards

    Volunteer Dashboard: list of NGOs, filterable

    NGO Dashboard: list of Volunteers, filterable

    Admin Dashboard: list of users with actions (delete, create, assign role, reset password)

Messaging / Contact

    Contact button opens conversation (via Message Center)

    Message Center: inbox list + conversation window

    Message metadata (e.g., sender, recipient, timestamps)

Access Control

    Route protection based on auth/role

    Prevent unauthorized profile/dashboard access

#### 3. Acceptance Criteria (Per Component)
User Authentication

[] Users can register with appropriate roles (Volunteer, NGO. Admin accounts created manually)

[] Passwords are hashed and stored securely

[] Users can log in and log out successfully

[] Users can reset their password via email link

[] Users are redirected to the correct dashboard based on their role

Navigation Bar

[] Navigation displays Dashboard, Profile, Messages, Logout for logged-in users

[] Navigation displays Login/Register for unauthenticated users

[] Navigation updates dynamically based on user role

Registration Forms

[] Volunteer registration includes hours, resume upload, background check trigger

[] NGO registration includes organization name, email, and areas of concern

[] All form inputs are validated and stored correctly in the database

Profile Pages

[] Users can view and edit their own profile (name, email, etc.)

[] Admin profile displays name/email and role (non-editable)

[] NGOs can view Volunteer profiles in read-only format

[] Volunteers can view NGO profiles in read-only format

Dashboards

[] Volunteers see a dashboard of NGOs needing help, with filters

[] NGOs see a dashboard of available Volunteers, with filters

Admin Dashboard

[] Admin sees a user management dashboard with search/filter tools

[] Admin can see a list of all users

[] Admin can delete/add users and assign/revoke Admin roles

[] Admin can reset user passwords

Communication

[] NGOs can contact Volunteers via the "Contact" button on profile pages

[] Volunteers can contact NGOs via the "Contact" button on profile pages

[] Clicking Contact opens the Message Center with a preloaded conversation

[] Message Center includes an inbox list and live conversation window

Access Control

[] Volunteers and NGOs cannot access Admin features

[] Users cannot view other users’ profiles unless allowed by their role (Volunteers can only see NGO profiles and vice versa)

[] Route protection prevents access to unauthorized pages

#### 4. Acceptance Criteria (Whole Project)
[] Users can register, log in, and reset their passwords securely

[] Users are redirected to the correct dashboard based on role

[] Role-based access is enforced throughout the application

[] NGOs can view and contact available volunteers

[] Volunteers can view and contact NGOs seeking help

[] Admin can manage users, roles, and account security

[] The communication system is functional and intuitive

[] All forms validate and store the required information

[] Users can edit their own profiles as expected

[] All pages are navigable and visually coherent

[] The wireframe functionality is faithfully implemented in the UI

[] The application is ready for user testing and potential deployment

## c. Technology Stack and Rationale
- Frontend: React – I did some research and discovered React is very commonly used in today's websites. I wanted modern.
- Backend: Node.js – I chose to work in JavaScript, front and backend.
- Database: MongoDB – Again, I wanted to use modern and commonly used services.

## d. Testing Methods
- Black Box: ...
- Unit Testing: ...
(Include which components were tested and how)

## e. Challenges Faced
- Example: Integrating Auth0 with backend...

## f. Lessons Learned
- What you discovered during dev...

## g. Future Recommendations
- What you’d do differently next time...
