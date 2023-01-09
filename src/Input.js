import React, { useMemo, useCallback } from "react";
import { TextField, Label, Dropdown } from "monday-ui-react-core"

const Input = ({ input, jobDetails, setJobDetails }) => {

  const changeInputValue = value => {
    setJobDetails({
      ...jobDetails,
      [input.id]: {
        ...jobDetails[input.id],
        text: value,
      },
    })
  }

  return (
    <>
      {input.type === "name" && (
        <TextField
          required
          onChange={changeInputValue}
          value={jobDetails[input.id].text}
          id={input.id}
        />
      )}
      {input.type === "text" && (
        <TextField
          id={input.id}
        />
      )}
      {input.type === "long-text" && (
        <textarea
          id={input.id}
        />
      )}
      {input.type === "numeric" && (
        <TextField 
          id={input.id}
        />
      )}
    </>
  )
}

export default Input;