"use client"; // Needed for interactive components

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import { navItems } from "@/assets";
import { Button } from "@/components/ui/button";
import { Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  // State to control search focus
  const [showSearchInput, setShowSearchInput] = useState(false);

  return (
    <section className="bg-slate-50 py-3 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Image src="/sunsafe.svg" alt="logo" width={150} height={36} />
          </div>
          
          {/* Desktop Search */}
          <div className="hidden md:block w-64">
            <Input className="w-full" placeholder="Search"/>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.label}>
                    <NavigationMenuTrigger className="text-sm">
                      {item.label}
                    </NavigationMenuTrigger>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          {/* Mobile Hamburger and Sidebar */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] max-w-sm flex flex-col p-0">
                {/* Sidebar header with logo */}
                <SheetHeader className="border-b p-4">
                  <SheetTitle className="text-left">SunSafe</SheetTitle>
                </SheetHeader>
                
                {/* Sidebar content */}
                <div className="flex-1 overflow-auto">
                  {/* Navigation Links */}
                  <div className="p-4 pb-8">
                    <nav className="space-y-1">
                      {navItems.map((item) => (
                        <Link 
                          key={item.label}
                          href="#" 
                          className="flex items-center h-10 px-4 rounded-md text-sm font-medium hover:bg-slate-100"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                  </div>
                </div>
                
                {/* Sidebar footer with search */}
                <div className="border-t p-4">
                  {showSearchInput ? (
                    <Input 
                      className="w-full" 
                      placeholder="Search"
                      autoFocus={false} // Prevent keyboard from opening automatically
                    />
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setShowSearchInput(true)}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Navbar;