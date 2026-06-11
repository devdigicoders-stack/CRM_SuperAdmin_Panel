import { lazy } from "react";
import { FaTachometerAlt, FaUsers, FaShieldAlt, FaCog, FaBell, FaBullhorn, FaUser, FaLock, FaUserPlus, FaCalendarAlt, FaExclamationTriangle } from "react-icons/fa";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const CreateAdmin = lazy(() => import("../pages/CreateAdmin"));
const CreateUser = lazy(() => import("../pages/CreateUser"));
const GlobalSettings = lazy(() => import("../pages/GlobalSettings"));
const Notifications = lazy(() => import("../pages/Notifications"));
const LeadManagement = lazy(() => import("../pages/LeadManagement"));
const Profile = lazy(() => import("../pages/Profile"));
const ChangePassword = lazy(() => import("../pages/ChangePassword"));
const CalendarView = lazy(() => import("../pages/CalendarView"));
const MissedFollowUps = lazy(() => import("../pages/MissedFollowUps"));

const routes = [
  { path: "/dashboard", component: Dashboard, name: "Dashboard", icon: FaTachometerAlt, permission: "dashboard" },
  { path: "/create-admin", component: CreateAdmin, name: "Create Admin", icon: FaUserPlus, superAdminOnly: true },
  { path: "/create-staff", component: CreateUser, name: "Create Staff", icon: FaUser, permission: "users" },
  { path: "/lead-management", component: LeadManagement, name: "Lead Management", icon: FaBullhorn, permission: "leads" },
  { path: "/global-settings", component: GlobalSettings, name: "Global Settings", icon: FaCog, permission: "settings" },
  { path: "/calendar", component: CalendarView, name: "Calendar", icon: FaCalendarAlt, permission: "leads" },
  { path: "/notifications", component: Notifications, name: "Notifications", icon: FaBell },
  { path: "/profile", component: Profile, name: "My Profile", icon: FaUser },
  { path: "/change-password", component: ChangePassword, name: "Change Password", icon: FaLock },
  { path: "/missed-follow-ups", component: MissedFollowUps, name: "Missed Follow-Ups", icon: FaExclamationTriangle, hide: true, permission: "dashboard" },
];

export default routes;
