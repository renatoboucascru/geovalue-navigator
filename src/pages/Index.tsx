import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useScreenerStore } from '@/store/screenerStore';
import { InputScreen } from '@/components/InputScreen';
import { ResultsScreen } from '@/components/ResultsScreen';
import { LoadingScreen } from '@/components/LoadingScreen';

const Index = () => {
  const { step, isLoading } = useScreenerStore();

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen key="loading" />}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {step === 'input' && !isLoading && (
          <InputScreen key="input" />
        )}
        {(step === 'results' || step === 'detail') && !isLoading && (
          <ResultsScreen key="results" />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
