import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { hero } from '@/assets'

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-sky-400 to-blue-600">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-yellow-300 opacity-10 rounded-bl-[100px]"></div>
      
      <div className=" mx-auto px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text content */}
          <div className="space-y-6 text-white z-10">
            <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
              Sun Safe. Skin Safe. Life Safe.
            </span>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Protect Your Skin. <br />
              <span className="text-yellow-300">Enjoy The Sun.</span>
            </h1>
            
            <p className="text-xl max-w-md">
              Advanced sun protection knowledge and products for a healthier outdoor lifestyle.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-yellow-300 hover:text-blue-800">
                Get Protected
              </Button>
              <Button size="lg" variant="outline" className="text-blue-600 border-white hover:text-blue-800 hover:bg-white/20">
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Hero image - using the imported hero from assets */}
          <div className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-2xl z-10">
            <Image
              src={hero}
              alt="Person enjoying the sun safely"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
      
      {/* Stats bar */}
      <div className="bg-white/10 backdrop-blur-sm py-4 border-t border-white/20">
        <div className=" mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
            <div className="px-4 py-2 text-center">
              <p className="text-2xl font-bold">5 million+</p>
              <p className="text-sm opacity-80">Skin cancers diagnosed annually</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-2xl font-bold">90%</p>
              <p className="text-sm opacity-80">Of skin aging caused by sun</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-2xl font-bold">15 minutes</p>
              <p className="text-sm opacity-80">To sunburn on high UV days</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-2xl font-bold">SPF 30+</p>
              <p className="text-sm opacity-80">Recommended minimum</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero