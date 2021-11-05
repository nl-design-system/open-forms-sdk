import {Formio} from "react-formio";

const Time = Formio.Components.components.time;


class TimeField extends Time {
  static schema(...extend) {
    return Time.schema({
      inputType: 'text',
      format: 'HH:mm',
    }, ...extend);
  }

  get suffix() {
    // Don't show an icon
    return null;
  }

  get inputInfo() {
    const info = super.inputInfo;
    // change the default CSS classes
    info.attr.class = 'utrecht-textbox';
    return info;
  }
}


export default TimeField;
