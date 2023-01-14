import React, { useMemo, useCallback } from "react";
import { TextField, Label, Dropdown } from "monday-ui-react-core"

const Input = ({ input, jobDetails, setJobDetails }) => {

  const changeInputValue = useCallback(value => {
    setJobDetails({
      ...jobDetails,
      [input.id]: {
        ...jobDetails[input.id],
        text: String(value),
      },
    })
  })

  return (
    <>
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