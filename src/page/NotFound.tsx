import React from "react";
import { Column, Title } from "components/Basics";

export const NotFound: React.FC = () => (
  <div className="container fullheight">
    <div className="columns is-centered is-vcentered">
      <Column narrow>
        <Title>(404) not-found</Title>
        <p>
          <a href="mailto:sam@mohr.codes">Personally text Sam Mohr</a> if you
          think there's an error.
        </p>
      </Column>
    </div>
  </div>
);
