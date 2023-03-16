import React from "react"
import { Box } from "monday-ui-react-core"
import { TextField } from "monday-ui-react-core"

const AccountInfo = ({
  accountDetails,
  accountEdits,
  accountFields,
  setAccountEdits,
  setAccountDetails,
}) => {

  const handleChangeValue = (value, field) => {
    setAccountDetails({
      ...accountDetails,
      [field.id]: value
    })
    setAccountEdits({
      ...accountEdits,
      [field.id]: value,
    })
  }

  return (
    <>
      {accountFields.map(field => (
        <>
          {field.type === "text" && (
            <Box
              border={Box.borders.DEFAULT}
              padding={Box.paddings.NONE}
              className="already-border-left"
            >
              <label className="label-header" htmlFor={field.id}>Company</label>
              <TextField
                className="custom-input-component"
                id={field.id}
                value={accountDetails[field.id].text}
                onChange={value => handleChangeValue(value, field)}
              />
            </Box>
          )}
          {field.type === "long-text" && (
            <Box
              border={Box.borders.DEFAULT}
              padding={Box.paddings.NONE}
              className="already-border-left"
            >
              <label className="label-header" htmlFor={field.id}>Address</label>
              <textarea
                id={field.id}
                rows={3}
                value={accountDetails[field.id].text}
                onChange={e => handleChangeValue(e.target.value, field)}
              />
            </Box>
          )}
        </>
      ))}
    </>
  )
}

export default AccountInfo