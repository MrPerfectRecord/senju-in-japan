import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import MangaIndex from "./pages/MangaIndex";
import MangaReader from "./pages/MangaReader";
import AdminLogin from "./pages/AdminLogin";
import ReaderLogin from "./pages/ReaderLogin";
import AcceptInvite from "./pages/AcceptInvite";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EditCreator from "./pages/admin/EditCreator";
import EditSocials from "./pages/admin/EditSocials";
import EditStats from "./pages/admin/EditStats";
import EditSponsors from "./pages/admin/EditSponsors";
import EditArticles from "./pages/admin/EditArticles";
import EditInquiries from "./pages/admin/EditInquiries";
import EditMedia from "./pages/admin/EditMedia";
import ManageManga from "./pages/admin/ManageManga";
import EditChapter from "./pages/admin/EditChapter";
import ManageUsers from "./pages/admin/ManageUsers";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/manga" element={<MangaIndex />} />
        <Route path="/manga/:slug" element={<MangaReader />} />
        <Route path="/signup" element={<ReaderLogin mode="signup" />} />
        <Route path="/login" element={<ReaderLogin mode="login" />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="creator" element={<EditCreator />} />
          <Route path="socials" element={<EditSocials />} />
          <Route path="stats" element={<EditStats />} />
          <Route path="sponsors" element={<EditSponsors />} />
          <Route path="articles" element={<EditArticles />} />
          <Route path="inquiries" element={<EditInquiries />} />
          <Route path="media" element={<EditMedia />} />
          <Route path="manga" element={<ManageManga />} />
          <Route path="manga/:id" element={<EditChapter />} />
          <Route path="users" element={<ManageUsers />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
