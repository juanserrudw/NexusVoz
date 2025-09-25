import React from 'react';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';

const LandingLayout = ({ children }) => {
  return (
    <div className="bg-gray-900 text-white overflow-x-hidden">
      <LandingHeader />
      <main>
        {children}
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingLayout;