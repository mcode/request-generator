import React, { useState } from "react";
// import "./smart.css";
import { Button } from "semantic-ui-react";

export default function SMARTBox(props) {
  const { children, title = "" } = props;
  const [visible, setVisible] = useState(true);

  return (
    visible && (
      <section className="smartBox">
        <header>
          <h5>{title}</h5>
          <Button icon="close" onClick={() => setVisible(false)} />
        </header>
        {children}
      </section>
    )
  );
}
