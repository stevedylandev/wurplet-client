import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { WorkerRequest } from "../types";
import { useFetch } from "../hooks/useFetch";
import { Context } from "@farcaster/frame-sdk";
import sdk from "@farcaster/frame-sdk";
import { Button } from "../components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { truncateAddress } from "@/lib/utils";

interface RegisterFormProps {
  nonce: string;
  message: string;
  farcasterSignature: string;
  name: string | undefined;
  setInitialized: (value: boolean) => void;
  setAddress: (value: string) => void;
  isInitialized: boolean;
}

export function RegisterForm({
  nonce,
  message,
  farcasterSignature,
  name,
  setInitialized,
  setAddress,
  isInitialized,
}: RegisterFormProps) {
  const { address } = useAccount();

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [addresses, setAddresses] = useState<string[] | undefined>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data, signMessage } = useSignMessage();

  useEffect(() => {
    const load = async () => {
      setContext(await sdk.context);
      sdk.actions.ready();
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  useEffect(() => {
    async function getAddresses() {
      if (context?.user.fid) {
        try {
          const verificationRequest = await fetch(
            `https://hub.pinata.cloud/v1/verificationsByFid?fid=${context?.user.fid}`,
          );
          const verifications = await verificationRequest.json();

          const ethereumAddresses =
            verifications.messages
              ?.filter(
                (message: any) =>
                  message?.data?.verificationAddAddressBody?.protocol === "PROTOCOL_ETHEREUM",
              )
              .map((message: any) => message.data.verificationAddAddressBody.address)
              .filter(Boolean) || [];

          setAddresses(ethereumAddresses);
        } catch (error) {
          console.error("Error fetching addresses:", error);
        }
      }
    }
    getAddresses();
  }, [context?.user.fid]);

  const nameData: WorkerRequest["signature"]["message"] = {
    name: `${name}.wurplet.eth`,
    owner: address!,
    addresses: {
      "60": selectedAddress,
      "2147492101": selectedAddress,
    },
  };

  const requestBody: WorkerRequest = {
    signature: {
      hash: data!,
      message: nameData,
    },
    expiration: new Date().getTime() + 60 * 60,
    siwfSignature: farcasterSignature,
    siwfNonce: nonce,
    siwfMessage: message,
  };

  const {
    data: gatewayData,
    error: gatewayError,
    isLoading: gatewayIsLoading,
  } = useFetch(data && "https://wurplet-server.stevedsimkins.workers.dev/set", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  useEffect(() => {
    if (gatewayData) {
      setIsSubmitting(false);
      setInitialized(true);
      if (selectedAddress) {
        setAddress(selectedAddress);
      }

      toast({
        title: "Success!",
        description: isInitialized
          ? `${name}.wurplet.eth has been updated to point to ${truncateAddress(selectedAddress)}`
          : `${name}.wurplet.eth has been claimed successfully!`,
      });
    } else if (gatewayError) {
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          gatewayError.message === "Conflict"
            ? "Somebody already registered that name"
            : `Something went wrong: ${gatewayError}`,
      });
    }
  }, [
    gatewayData,
    gatewayError,
    selectedAddress,
    setAddress,
    setInitialized,
    name,
    isInitialized,
    toast,
  ]);

  const handleSubmit = () => {
    if (!selectedAddress) {
      alert("Please select an address first");
      return;
    }
    setIsSubmitting(true);
    signMessage({ message: JSON.stringify(nameData) });
  };

  if (!isSDKLoaded) {
    return <div>Loading..</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Select
        onValueChange={(value) => setSelectedAddress(value)}
        disabled={isSubmitting || gatewayIsLoading}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select an address" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Addresses</SelectLabel>
            {addresses?.map((address, index) => (
              <SelectItem key={index} value={address}>
                {truncateAddress(address)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {isSubmitting || gatewayIsLoading ? (
        <Button disabled>
          <Loader2 className="animate-spin" />
          {isInitialized ? "Updating..." : "Claiming..."}
        </Button>
      ) : (
        <Button onClick={handleSubmit} disabled={!selectedAddress}>
          {isInitialized ? "Update Address" : "Claim ENS"}
        </Button>
      )}

      {isInitialized && (
        <>
          <Button
            onClick={async () =>
              await sdk.actions.openUrl(`https://app.ens.domains/${name}.wurplet.eth`)
            }
          >
            View Name on ENS
          </Button>
          <Button
            onClick={async () =>
              await sdk.actions
                .openUrl(`https://warpcast.com/~/compose?text=Check%20out%20my%20Wurplet%20ENS!%0A%0A${name}.wurplet.eth%0A%0AGet%20yours%20now%3A%20https%3A%2F%2Fwurplet.xyz&embeds%5B%5D=https%3A%2F%2Fwurplet.xyz
`)
            }
          >
            Share
          </Button>
        </>
      )}

      {gatewayError && (
        <div className="text-red-500 text-sm mt-2">
          {gatewayError.message === "Conflict"
            ? "Somebody already registered that name"
            : "Something went wrong"}
        </div>
      )}
    </div>
  );
}
