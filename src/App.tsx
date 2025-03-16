import { useEffect, useState } from 'react'
import { Context } from '@farcaster/frame-sdk';
import sdk from '@farcaster/frame-sdk';
import { RegisterForm } from './components/register-form';
import { Button } from './components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Marquee from '@/components/ui/marquee'
import { Toaster } from './components/ui/toaster';
import { truncateAddress } from './lib/utils';
import { nanoid } from 'nanoid';

function App() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [nonce, setNonce] = useState('');
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [name, setName] = useState<string | undefined>(undefined)
  const [initialized, setInitialized] = useState(false)
  const [address, setAddress] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  useEffect(() => {
    setNonce(nanoid(16));
  }, []);

  useEffect(() => {
    const load = async () => {
      setContext(await sdk.context);
      sdk.actions.ready();
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded, nonce]);

  useEffect(() => {
    async function getName() {
      if (context?.user.fid) {
        const nameRequest = await fetch(`https://fnames.farcaster.xyz/transfers?fid=${context.user.fid}`)
        const nameResponse = await nameRequest.json()
        setName(nameResponse.transfers.slice(-1)[0].username)
      }
    }
    getName();
  }, [context?.user.fid]);

  useEffect(() => {
    if (!name) return
    async function checkNameRegistration() {
      try {
        const request = await fetch(`https://wurplet-server.stevedsimkins.workers.dev/get/${name}.wurplet.eth`)
        const response = await request.json()
        if (response.addresses && response.addresses['60']) {
          setInitialized(true)
          setAddress(response.addresses['60'])
        }
      } catch (error) {
        console.error("Error checking name:", error)
      }
    }
    checkNameRegistration()
  }, [name])

  async function signIn() {
    setIsAuthenticating(true)
    try {
      const data = await sdk.actions.signIn({ nonce });
      console.log(data)
      setSignature(data.signature)
      setMessage(data.message)
    } catch (error) {
      console.error("Error during sign in:", error)
    } finally {
      setIsAuthenticating(false)
    }
  }

  if (!isSDKLoaded) {
    return <div>Loading..</div>
  }

  if (!context) {
    if (!context) {
      return (
        <div className='flex flex-col items-center justify-center min-h-screen gap-3'>
          <h1 className='text-5xl font-bold'>Wurplet.eth</h1>
          <h3 className='text-center'>A free ENS for your Wurplet <br />...Warplet?... you know</h3>
          <Button onClick={() => window.open('https://warpcast.com', '_blank')}>Open in Warpcast</Button>
        </div>
      )
    }

  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen gap-3'>
      <Dialog>
        {!message && !signature && (
          <>
            <h1 className='text-5xl font-bold'>Wurplet.eth</h1>
            <h3 className='text-center'>A free ENS for your Wurplet <br />...Warplet?... you know</h3>
            <Button onClick={signIn} disabled={isAuthenticating}>
              {isAuthenticating ? "Signing In..." : "Sign In"}
            </Button>
            <DialogTrigger asChild>
              <Button>How does it work?</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>How does it work?</DialogTitle>
              </DialogHeader>
              <p>Ever want to send funds to your Warpcast Wallet but don't remember the address? Wurplet.eth is here to help!</p>
              <p>This frame will have you sign in with your Farcaster account, and then using your FID will grab your fname (e.g. dwr) as well as your verified addresses. Then you can select which address your-fname.wurplet.eth will point to.</p>
              <p>Example: My fname is stevedylandev, my wurplet address ends in 02E3, so by using Wurplet I can have stevedylandev.wurplet.eth resolve to that address.</p>
              <p>This is possible through ENS and CCIP Gateways. Ideally this will happen with farcaster.eth in the near future, but in the meantimem enjoy your free Wurplet.eth name!</p>
            </DialogContent>
          </>
        )}

        {message && signature && (
          <>
            <h1 className='text-5xl font-bold mb-8'>Wurplet.eth</h1>
            <Marquee items={[`${name}.wurplet.eth`]} />
            {initialized ? (
              <div className="mt-4 text-center">
                <p className="font-medium">Your ENS points to:</p>
                <p className="font-mono break-all">{truncateAddress(address)}</p>
              </div>
            ) : (
              <p className='text-center max-w-sm'>Select an address that you would like your Wurplet.eth ENS to point to. <br />
                Make sure you are using your Wurplet!</p>
            )}

            <RegisterForm
              setInitialized={setInitialized}
              setAddress={setAddress}
              nonce={nonce}
              message={message}
              farcasterSignature={signature}
              name={name}
              isInitialized={initialized}
            />
          </>
        )}
        <Toaster />
      </Dialog>
    </div>
  )
}

export default App
