# Project Documentation

## a. Overview / Summary
GuardianLink is an online platform that helps connect cybersecurity volunteers with organizations that need cybersecurity assistance.
The goal of GuardianLink is to promote a more secure online ecosystem, by encouraging good cybersecurity practices through our volunteers' expert advice.

## b. Wireframe Diagram and Planning Docs

### i. Wireframe Diagram
/wireframe.png

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

Home Page | purpose and partnerships

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

[x] Users can register with appropriate roles (Volunteer, NGO. Admin accounts created manually)

[x] Passwords are hashed and stored securely

[x] Users can log in and log out successfully

[x] Users can reset their password via admin

[x] Users are redirected to the correct dashboard based on their role

Navigation Bar

[x] Navigation displays Home, Dashboard, Profile, Messages, Logout for logged-in users

[x] Navigation displays Home, Login, Register for unauthenticated users

[x] Navigation updates dynamically based on user role

Registration Forms

[x] Volunteer registration includes hours, resume upload, background check trigger

[x] NGO registration includes organization name, email, and areas of concern

[x] All form inputs are validated and stored correctly in the database

Profile Pages

[x] Users can view and edit their own profile

[x] Admin profile displays name/email and role (non-editable)

[x] NGOs can view only Volunteer profiles

[x] Volunteers can view only NGO profiles

Dashboards

[x] Volunteers see a dashboard of NGOs needing help, with filters

[x] NGOs see a dashboard of available Volunteers, with filters

Admin Dashboard

[x] Admin sees a user management dashboard with search/filter tools

[x] Admin can see a list of all users

[x] Admin can delete/add users and assign/revoke Admin roles

[x] Admin can reset user passwords

Communication

[x] NGOs can contact Volunteers via the "Contact" button on profile pages

[x] Volunteers can contact NGOs via the "Contact" button on profile pages

[x] Clicking Contact opens the Message Center with a preloaded conversation

[x] Message Center includes an inbox list and live conversation window

Access Control

[x] Volunteers and NGOs cannot access Admin features

[x] Users cannot view other users’ profiles unless allowed by their role (Volunteers can only see NGO profiles and vice versa)

[x] Route protection prevents access to unauthorized pages

#### 4. Acceptance Criteria (Whole Project)
[x] Users can register, log in, and reset their passwords securely

[x] Users are redirected to the correct dashboard based on role

[x] Role-based access is enforced throughout the application

[x] NGOs can view and contact available volunteers

[x] Volunteers can view and contact NGOs seeking help

[x] Admin can manage users, roles, and account security

[x] The communication system is functional and intuitive

[x] All forms validate and store the required information

[x] Users can edit their own profiles as expected

[x] All pages are navigable and visually coherent

[x] The wireframe functionality is faithfully implemented in the UI

[x] The application is ready for user testing and potential deployment

## c. Technology Stack and Rationale
- Frontend: React – I did some research and discovered React is very commonly used in today's websites. I wanted something modern and transferable.
- Backend: Node.js – I chose to work in JavaScript, front and backend.
- Database: MongoDB – Again, I wanted to use modern and commonly used services.

## d. Testing Methods
All my testing was done manually through Postman to interact with my database. After I set up the frontend to a sufficient degree, I interacted with the frontend.
All testing was done manually by myself, anytime after implementing a working verison of a feature I tested it.

## e. Challenges Faced
- Because I have two types of users in my system, I decided to separate every user's data into role specific profile data and authentication data.
I chose this for readability/organization and performance reasons.
This means every user has their data separated into two database models, and I use a User.refId field to associate the User with the Volunteer/NGO models.
Getting the system to consistently match the User.refId with the associated Volunteer/NGO account was a trouble point throughout until I did some deep debugging and finally solved the issues.
- Had to learn the hard way to make more consistent version commits.

## f. Lessons Learned
- Switching the submission type for the registration and editing routes in volunteers.js from a raw json to form-data,
was necessary because of the need to upload a resume.
- Work flow, best practice is to first focus on your back end routes being flexible and solid,
and all the details of front end work can then be considered later.
- Instead of using just a concatenated string of two user IDs to flag message conversations,
I used a hashing algorithm to convert that string into a fixed character-length hashed string to promote uniform distribution and performance.

## g. Future Recommendations
- Need to make frequent version commits to Github to avoid losing hours of work to mistakes.
- Take longer to really understand and flesh out the multiple user model system, if being used. That way, troubles with resolving users to profiles will be less frequent.
