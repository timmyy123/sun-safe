"use client"; // Needed for interactive components

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
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
import { NavigationMenuLink } from "@radix-ui/react-navigation-menu";

const Navbar = () => {
  // State to control search focus
  const [showSearchInput, setShowSearchInput] = useState(false);

  return (
    <section className="bg-sky-200/80 py-3 px-4">
      <div className="container mx-auto">
        {/* Grid System Layout */}
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Logo - 2 cols */}
          <Link className="col-span-6 xl:col-span-2" href='/'>
            <Image src="/sunsafe.svg" alt="logo" width={150} height={36} />
          </Link>
          
          {/* Search - 3 cols (hidden on mobile) */}
          <div className="hidden xl:block xl:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className="w-[70%] bg-white/80 border-0 text-white pl-10 focus:bg-white/30" 
                placeholder="Search"
              />
            </div>
          </div>
          
          {/* Desktop Navigation - 7 cols (hidden on mobile) */}
          <div className="hidden xl:block xl:col-span-7">
            <div className="flex items-center justify-end">
              <NavigationMenu>
                <NavigationMenuList>
                  {navItems.map((item) => (
                    <NavigationMenuItem key={item.label}>
                      <NavigationMenuTrigger className="text-sm bg-yellow-300/80 text-sky-600">
                        {item.label}
                      </NavigationMenuTrigger>
                      {item.tabs && (
                        <NavigationMenuContent className="min-w-[200px] w-max max-w-[400px]">
                          <ul className="grid w-full gap-2 p-4">
                            {item.tabs.map((tab) => (
                              <li key={tab.label}>
                                <NavigationMenuLink 
                                  href={tab.link} 
                                  className="block w-full whitespace-nowrap px-4 py-2 hover:bg-slate-100 rounded-md"
                                >
                                  {tab.label}
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
              <Button size="sm" className="ml-4 text-sm bg-yellow-300/80 text-sky-600 hover:bg-sky-300 hover:text-yellow-200">
                Get Protected
              </Button>
            </div>
          </div>
          
          {/* Mobile Hamburger - Right aligned (only visible on mobile) */}
          <div className="col-span-6 xl:hidden flex justify-end">
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
                          className="flex items-center h-10 px-4 rounded-xl text-sm font-medium hover:bg-slate-100"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div className="pt-4">
                        <Button className="w-full bg-white text-blue-600 hover:bg-yellow-300 hover:text-blue-800">
                          Get Protected
                        </Button>
                      </div>
                    </nav>
                  </div>
                </div>
                
                {/* Sidebar footer with search */}
                <div className="border-t p-4">
                  {showSearchInput ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        className="w-full pl-10" 
                        placeholder="Search"
                        autoFocus={false} // Prevent keyboard from opening automatically
                      />
                    </div>
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