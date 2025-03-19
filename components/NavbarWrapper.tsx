'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const pathname = usePathname();
  const isHomepage = pathname === '/';
  
  if (isHomepage) {
    return null;
  }
  
  return <Navbar />;
} 