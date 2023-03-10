import React, { useState } from "react";
import { DatePicker, Button } from "monday-ui-react-core"
import { format, parseISO } from 'date-fns'

const Calendar = ({
  className,
  field,
  jobDetails,
  changeJobDetails,
  changeJobEdits,
}) => {
  const [showPicker, setShowPicker] = useState(false)

  const handlePickDate = date => {
    // returns formatted date string
    const newDate = format(new Date(date._d), "yyyy-MM-dd")

    changeJobEdits(newDate)
    changeJobDetails(date, "date")
    changeJobDetails(newDate, "text")
    setShowPicker(!showPicker)
  }

  const handleButtonText = () => {
    if (jobDetails[field.id].text) {
      return format(parseISO(jobDetails[field.id].text), "MM/dd/yyyy")
    }
    else {
      return "Select date"
    }
  }

  return (
    <>
      <button
        className={className}
        color={Button.colors.PRIMARY}
        kind={Button.kinds.SECONDARY}
        size={Button.sizes.SMALL}
        onClick={() => setShowPicker(!showPicker)}
      >
        {handleButtonText()}
      </button>
      {showPicker && (
        <DatePicker
          className="date-picker-component"
          date={jobDetails[field.id].date}
          onPickDate={d => handlePickDate(d)}
        />
      )}
    </>
  )
}

export default Calendar