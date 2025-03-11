import Image from "next/image";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AIAssistantButton from "@/components/AIAssistantButton";

export default function Home() {
  return (
    <>
      <section>
        <Hero/>
      </section>
      <AIAssistantButton/>
    </>
  );
}