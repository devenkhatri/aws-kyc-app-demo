import './App.css';
import { Amplify } from 'aws-amplify';
import { withAuthenticator} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import awsconfig from './aws-exports';
import KYCContainer from './components/KYCContainer';
Amplify.configure(awsconfig);

function App() {
  return (
    <div>
      <KYCContainer />
    </div>
  );
}

export default withAuthenticator(App);
