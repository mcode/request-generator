import React, { Component } from "react";
// import './SettingsBox.css';
import { Button, Checkbox, Container, Header, Input } from "semantic-ui-react";

function SettingControl(props) {
  const { display, header, type, value, update } = props;

  switch (type) {
    case "input":
      return <Input value={value} onChange={(e) => update(e.currentTarget.value)} label={display} />;

    case "check":
      return <Checkbox toggle label={display} checked={value} onChange={(_e, { checked }) => update(checked)} />;

    case "button":
      return (
        <Button key={header} onClick={() => update(value)}>
          {display}
        </Button>
      );
    case "spacer":
      return <br key={header} />;
    case "line":
      return <hr key={header} />;
    default:
      return <Input disabled key={header} label={display} value={value} />;
  }
}

/*
const headers = {
      ehrUrl: {
        type: "input",
        display: "EHR Server",
        value: this.state.ehrUrl,
        key: "ehrUrl",
      },
      ...etc
    }
*/

export class SettingsBox extends Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.updateCB = this.updateCB.bind(this);
  }

  updateCB(elementName, value) {
    this.props.updateCB(elementName, value);
  }

  render() {
    const headers = this.props.headers;

    return (
      <Container>
        <Header>Settings</Header>
        <div
          style={{
            display: "grid",
            gridAutoFlow: "row",
            gap: "0.5em",
          }}
        >
          {Object.values(headers).map((h) => (
            <SettingControl {...h} update={(value) => this.updateCB(h.key, value)} />
          ))}
        </div>
      </Container>
    );
  }
}
