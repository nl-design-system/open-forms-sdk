import Body from 'components/Body';

import PostCompletionView from './PostCompletionView';

export default {
  title: 'Private API / Post completion views ',
  render: ({body, ...args}) => <PostCompletionView {...args} body={<Body>{body}</Body>} />,
};

export const Generic = {
  args: {
    pageTitle: 'Confirmation',
    header: 'Confirmation!',
    body: 'This is some text for the body',
    mainWebsiteUrl: '#',
    reportDownloadUrl: '#',
    downloadPDFText: 'Download a PDF of your submitted answers',
  },
};
