// /src/pages/_app.tsx
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

// Custom Bouncing Balls Loader Component
const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
      <div className="relative w-[200px] h-[60px] z-10">
        {/* Circles */}
        <div className="absolute w-5 h-5 rounded-full bg-gray-800 left-[15%] origin-center animate-bounce-custom" />
        <div className="absolute w-5 h-5 rounded-full bg-gray-800 left-[45%] origin-center animate-bounce-custom animation-delay-200" />
        <div className="absolute w-5 h-5 rounded-full bg-gray-800 right-[15%] origin-center animate-bounce-custom animation-delay-300" />
        
        {/* Shadows */}
        <div className="absolute w-5 h-1 rounded-full bg-black/90 top-[62px] left-[15%] origin-center -z-10 blur-[1px] animate-shadow-custom" />
        <div className="absolute w-5 h-1 rounded-full bg-black/90 top-[62px] left-[45%] origin-center -z-10 blur-[1px] animate-shadow-custom animation-delay-200" />
        <div className="absolute w-5 h-1 rounded-full bg-black/90 top-[62px] right-[15%] origin-center -z-10 blur-[1px] animate-shadow-custom animation-delay-300" />
        
        <style jsx>{`
          @keyframes bounce-custom {
            0% {
              top: 60px;
              height: 5px;
              border-radius: 50px 50px 25px 25px;
              transform: scaleX(1.7);
            }
            40% {
              height: 20px;
              border-radius: 50%;
              transform: scaleX(1);
            }
            100% {
              top: 0%;
            }
          }
          
          @keyframes shadow-custom {
            0% {
              transform: scaleX(1.5);
            }
            40% {
              transform: scaleX(1);
              opacity: 0.7;
            }
            100% {
              transform: scaleX(0.2);
              opacity: 0.4;
            }
          }
          
          .animate-bounce-custom {
            animation: bounce-custom 0.5s alternate infinite ease;
          }
          
          .animate-shadow-custom {
            animation: shadow-custom 0.5s alternate infinite ease;
          }
          
          .animation-delay-200 {
            animation-delay: 0.2s;
          }
          
          .animation-delay-300 {
            animation-delay: 0.3s;
          }
        `}</style>
      </div>
    </div>
  )
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleStart = () => {
      setLoading(true)
    }
    
    const handleComplete = () => {
      setLoading(false)
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

  return (
    <>
      {loading && <Loader />}
      <Component {...pageProps} />
    </>
  )
}

export default MyApp