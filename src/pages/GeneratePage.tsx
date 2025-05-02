import React, { useState, useEffect } from 'react';
import { PrimaryButton } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import PageLayout from '../components/layout/PageLayout';
import { nip44 } from "nostr-tools";
import { hexToBytes } from '@noble/hashes/utils'
import { WindowSSI } from '../window.ssi.type';

declare global {
  interface Window {
    ssi: WindowSSI
  }
}

// receiver's nostr key for NIP-44
const npub = "npub1s49u327wc6nfs9v47zsc93jsju5teyrey87qyf3hgnksc0wu7fkqwkjrhq";
const sec = "58fdfbf2fbab404deb98c626a2627e919e624d60984c4da0e46e2eae05243ee6";

interface GeneratePageProps {
  onMnemonicConfirmed: (mnemonic: string) => void;
  onBack: () => void;
  error: string | null;
  onClearError: () => void;
}

const GeneratePage: React.FC<GeneratePageProps> = ({
  onMnemonicConfirmed,
  onBack,
  onClearError
}) => {
  const [mnemonic, setMnemonic] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Generate mnemonic on component mount
  useEffect(() => {
    const generateMnemonic = async () => {
      try {
        // Generate a random mnemonic inside the browser
        const xpub = await window.ssi.bitcoin.generate({type: "mnemonic", strength: 256});
        console.log("generate", xpub)
        // Ask the user to share the mnemonic encrypted with Nostr NIP-44
        const encryptedSecret = await window.ssi.bitcoin.shareWith(npub, {type: "xprv", xpub});
        console.log("shareWith", encryptedSecret)
        // It's just a demo, so it is decypted immidiately, but it would be ideal to pass it to the SDK encrypted.
        const userPubkey = await window.ssi.nostr.getPublicKey();
        const sharedKey = nip44.getConversationKey(hexToBytes(sec), userPubkey);
        const newMnemonic = nip44.decrypt(encryptedSecret.secret, sharedKey);
        console.log("decrypt", newMnemonic)

        setMnemonic(newMnemonic);
      } catch (error) {
        console.error('Failed to generate mnemonic:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateMnemonic();
  }, []);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(mnemonic)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy mnemonic:', err));
  };

  const handleConfirmMnemonic = () => {
    onMnemonicConfirmed(mnemonic);
  };

  if (isLoading) {
    return (
      <PageLayout onBack={onBack} footer={<div />} title="Create New Wallet" onClearError={onClearError}>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner text="Generating secure wallet..." />
        </div>
      </PageLayout>
    );
  }
  const footer = (
    <div className="flex w-full p-4 max-w-1xl items-center">
      <PrimaryButton className="flex-0" onClick={handleConfirmMnemonic}>
        I've written it down
      </PrimaryButton>
    </div>
  )

  return (
    <PageLayout onBack={onBack} footer={footer} title="Create New Wallet" onClearError={onClearError}>

      <div className="flex flex-grow h-full flex-col max-w-2xl mx-auto px-4">

        <p className="text-[rgb(var(--text-white))] mb-4">
          Write down these 24 words in order and keep them safe. This recovery phrase is the only way to access your wallet if you lose your device.
        </p>

        <div className="bg-[rgb(var(--card-bg))] p-4 rounded-lg mb-4">
          <div className="grid grid-cols-3 gap-2">
            {mnemonic.split(' ').map((word, index) => (
              <div key={index} className="flex items-center">
                <span className="text-[rgb(var(--text-white))] opacity-50 mr-2 w-6 text-right">
                  {index + 1}.
                </span>
                <span className="text-[rgb(var(--text-white))] font-mono">
                  {word}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center my-4">
          <button
            onClick={handleCopyToClipboard}
            className="text-[rgb(var(--secondary-blue))] hover:underline flex items-center"
          >
            {isCopied ? '✓ Copied!' : '📋 Copy to clipboard'}
          </button>
        </div>

        <div className="text-center bg-yellow-800 bg-opacity-20 border border-yellow-600 text-yellow-200 p-4 rounded-md">
          <h3 className="font-bold mb-2">⚠️ Important Warning</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Never share your recovery phrase with anyone.</li>
          </ul>
        </div>
        <div className="flex-1" />
      </div>


    </PageLayout>
  );
};

export default GeneratePage;
