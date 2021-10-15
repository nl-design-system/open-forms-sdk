const TEMPLATE = `
<div class="utrecht-form-field utrecht-form-field--checkbox utrecht-form-field--distanced">
    <{{ctx.input.type}}
      ref="input"
      {% for (var attr in ctx.input.attr) { %}
      {{attr}}="{{ctx.input.attr[attr]}}"
      {% } %}
      id="{{ctx.instance.id}}-{{ctx.component.key}}"
      {% if (ctx.checked) { %}checked=true{% } %}
      class="utrecht-form-field__input utrecht-checkbox"
    >
        {{ctx.input.content}}
    </{{ctx.input.type}}>

<!--    <div class="checkbox__checkmark"></div>-->
    <label class="utrecht-form-field__label utrecht-form-field__label--checkbox utrecht-form-label utrecht-form-label--checkbox" for="{{ctx.instance.id}}-{{ctx.component.key}}">
        {{ctx.input.label}}&nbsp;
        {% if (ctx.component.tooltip) { %}
            <i ref="tooltip" class="{{ctx.iconClass('question-sign')}}"></i>
        {% } %}

  </label>
</div>
`;

export default TEMPLATE;
