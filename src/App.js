import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import Index from './pages/Index/Index.js';
import Contact from './pages/Contact/Contact.js';
import Our_team from './pages/Our_team/Our_team.js';
import Service from './pages/Service/Service.js';
import CatalogPublic from './pages/CatalogPublic/CatalogPublic.js';
import MasterClassPublicPage from './pages/MasterClassPublicPage/MasterClassPublicPage.js';
import InstructorPublicPage from './pages/InstructorPublicPage/InstructorPublicPage.js';
import NotFound from './pages/404/404.js';
import Instructors from './pages/Admin/Instructors/Instructors.js';
import Participants from './pages/Admin/Participants/Participants.js';
import MasterClasses from './pages/Admin/MasterClasses/MasterClasses.js';
import ContactRequests from './pages/Admin/ContactRequests/ContactRequests.js';
import AdminPayments from './pages/Admin/Payments/Payments.js';
import TestBuilder from './pages/Admin/TestBuilder/TestBuilder.js';
import ScheduleGroups from './pages/Admin/ScheduleGroups/ScheduleGroups.js';
import LoginPage from './pages/LoginPage/LoginPage.js';
import RegisterPage from './pages/RegisterPage/RegisterPage.js';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage.js';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage.js';
import ChangePasswordPage from './pages/ChangePasswordPage/ChangePasswordPage.js';
import ParticipantClasses from './pages/ParticipantClasses/ParticipantClasses.js';
import ParticipantFavorites from './pages/ParticipantFavorites/ParticipantFavorites.js';
import Tests from './pages/Tests/Tests.js';
import TestTake from './pages/TestTake/TestTake.js';
import './pages/Index/style.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/our_team" element={<Our_team />} />
          <Route path="/service" element={<Service />} />
          <Route path="/masterclass" element={<CatalogPublic />} />
          <Route path="/masterclass/:id" element={<MasterClassPublicPage />} />
          <Route path="/instructors/:id" element={<InstructorPublicPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/tests" element={<Tests />} />
          <Route
            path="/tests/:id"
            element={
              <PrivateRoute requireRole="participant">
                <TestTake />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/instructors"
            element={
              <PrivateRoute requireRole="admin">
                <Instructors />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/participants"
            element={
              <PrivateRoute requireRole="admin">
                <Participants />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/masterclasses"
            element={
              <PrivateRoute requireRole="admin">
                <MasterClasses />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/contact-requests"
            element={
              <PrivateRoute requireRole="admin">
                <ContactRequests />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <PrivateRoute requireRole="admin">
                <AdminPayments />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/tests"
            element={
              <PrivateRoute requireRole="admin">
                <TestBuilder />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/groups"
            element={
              <PrivateRoute requireRole="admin">
                <ScheduleGroups />
              </PrivateRoute>
            }
          />
          <Route
            path="/participant/classes"
            element={
              <PrivateRoute requireRole="participant">
                <ParticipantClasses />
              </PrivateRoute>
            }
          />
          <Route
            path="/participant/favorites"
            element={
              <PrivateRoute requireRole="participant">
                <ParticipantFavorites />
              </PrivateRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <PrivateRoute>
                <ChangePasswordPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;