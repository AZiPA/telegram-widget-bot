import { EndpointError } from 'sdk';
import { getWidgetDefinition } from '../lib/widgets/registry/index.js';
import { sendWidgetMessage } from '../lib/widgets/index.js';

export default async function (input, ctx) {
  const user = ctx?.initData?.user;
  if (!user) {
    throw new EndpointError('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const def = getWidgetDefinition(input?.type);
  if (!def) {
    throw new EndpointError('Unknown widget type', { code: 'UNKNOWN_WIDGET_TYPE' });
  }

  const res = await sendWidgetMessage(def, {
    chatId: user.id,
    chatType: 'private',
    params: input?.params ?? {},
    createdBy: user.id,
  });

  return {
    messageId: res.message.message_id,
  };
}
