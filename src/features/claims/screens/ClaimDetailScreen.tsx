import React from 'react';
import { BrainPreviewScreen } from '../../brain/screens/BrainPreviewScreen';

export const ClaimDetailScreen = (props: any) => {
  return <BrainPreviewScreen {...props} screenTitle="Claim detail" isClaimDetail={true} />;
};
