import React, { useMemo, useCallback } from "react";
import { Flex, TextField, Button, Label, Dropdown } from "monday-ui-react-core"

const Input = props => {
  const generateInput = input => {
    switch (input.type) {
      case "name":
        return (
          <TextField
            id={input.id}
            value={input.text}
          />
        )
      case "board-relation":
        return (
          <div>board relation dropdown</div>
        )
      case "multiple-person":
        return (
          <div>multiple person dropdown</div>
        )
      case "color":

      case "date":
        return (
          <div>date picker</div>
        )
      case "long-text":
        return (
          <textarea />
        )
      case "numeric":
        return (
          <TextField
            id={input.id}
          />
        )
      case "dropdown":
        return (
          <div>dropdown picker</div>
        )
      case "subtasks":
        return null
      default:

    }
  }

  return (
    
  )
}

export default Input;