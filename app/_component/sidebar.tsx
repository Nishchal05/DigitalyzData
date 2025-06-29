"use client";
import Link from "next/link";
import HomeIcon from '@mui/icons-material/Home';
import FeedbackIcon from '@mui/icons-material/Feedback';
import DashboardIcon from '@mui/icons-material/Dashboard';

export default function Sidebar() {
  return (
    <aside className="hidden md:block w-64 min-h-screen bg-white shadow-md fixed p-4 z-30">
      <header className=" text-black text-xl">
        Digitalyz Data
      </header>
      <nav className="mt-[20px] space-y-6">
        <Link href="/" className="flex items-center bg-blue-200 p-1 rounded-xl text-lg font-medium text-gray-800 hover:text-blue-600">
          <HomeIcon className="mr-2 text-blue-500" /> Home
        </Link>
        <Link href="/dashboard" className="flex items-center bg-blue-200 rounded-xl p-1 text-lg font-medium text-gray-800 hover:text-blue-600">
          <DashboardIcon className="mr-2 text-blue-500" /> Dashboard
        </Link>
        <Link href="/feedback" className="flex items-center bg-blue-200 rounded-xl p-1 text-lg font-medium text-gray-800 hover:text-blue-600">
          <FeedbackIcon className="mr-2 text-blue-500" /> Feedback
        </Link>
      </nav>
    </aside>
  );
}
