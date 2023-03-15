import React from "react"
import { Box, Flex } from "monday-ui-react-core"
import { TextField } from "monday-ui-react-core"
import Status from "./Status"

const AccountInfo = ({
  accountDetails
}) => {

  return (
    <Box
      border={Box.borders.DEFAULT}
      padding={Box.paddings.NONE}
    >
      {accountDetails.map(column => (
        <>
          {column.title === "Company" && (
            <Flex
              align={Flex.align.START}
              justify={Flex.justify.SPACE_BETWEEN}
            >
              <label>{column.title}</label>
              <TextField
                id={column.id}
                value={column.text}
              />
            </Flex>
          )}
          {column.title === "Address" && (
            <Flex
              align={Flex.align.START}
              justify={Flex.justify.SPACE_BETWEEN}
            >
              <label>{column.title}</label>
              <textarea
                id={column.id}
                rows={3}
                value={column.text}
              ></textarea>
            </Flex>
          )}
        </>
      ))}
    </Box>
  )
}

export default AccountInfo