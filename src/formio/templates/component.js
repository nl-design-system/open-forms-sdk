import { applyPrefix } from '../utils';

const TEMPLATE = `
<div id="{{ctx.id}}" class="{{ctx.classes}}"{% if (ctx.styles) { %} styles="{{ctx.styles}}"{% } %} ref="component">
  {% if (ctx.visible) { %}
  {{ctx.children}}
  {% } %}
  <div ref="messageContainer" class="${applyPrefix('errors')}"></div>
</div>
`;

export default TEMPLATE;
