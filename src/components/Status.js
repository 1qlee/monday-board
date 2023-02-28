import React, { useState, useEffect } from "react";
import { Chips, Flex } from "monday-ui-react-core";

const Status = ({
  changeJobEdits,
  field,
  jobDetails,
}) => {
  const settings = JSON.parse(field.settings_str)
  const { labels } = settings
  const [activeLabelText, setActiveLabelText] = useState("")
  const [allLabels, setAllLabels] = useState([]) 
  
  useEffect(() => {
    const labelsArray = []

    for (const label in labels) {
      const newLabel = {
        text: labels[label],
        style: settings.labels_colors[label],
        position: settings.labels_positions_v2[label],
        index: label,
      }

      labelsArray.push(newLabel)
    }

    labelsArray.sort((a, b) => a.position - b.position)
    
    setActiveLabelText(jobDetails[field.id].text)
    setAllLabels(labelsArray)
  }, [field, jobDetails[field.id]])

  const handleChipsClick = (status, index) => {
    if (status.target.children.length > 0) {
      setActiveLabelText(status.target.children[0].innerHTML)
    }
    else {
      setActiveLabelText(status.target.innerHTML)
    }

    changeJobEdits({ index: index })
  }

  return (
    <Flex
      wrap
    >
      {allLabels.map(label => (
        <Chips
          className={label.text === activeLabelText ? "is-active custom-chip-component" : "custom-chip-component"}
          color={label.text === activeLabelText ? label.style.color : "EXPLOSIVE"}
          label={label.text}
          readOnly
          onClick={e => handleChipsClick(e, label.index)}
        />
      ))}
    </Flex>
  )
}

export default Status