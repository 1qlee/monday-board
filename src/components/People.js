import React, { useState, useEffect } from "react";
import { Button, List, ListItem, ListTitle, Avatar, DialogContentContainer, Loader } from "monday-ui-react-core"

const People = ({
  changeJobEdits,
  field,
  jobDetails,
  monday,
}) => {
  const [showList, setShowList] = useState(false)
  const [activePerson, setActivePerson] = useState({
    name: "Select person",
    src: "",
  })
  const [users, setUsers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    monday.api(`query { users { id name photo_thumb_small } teams { id name picture_url }}`).then(res => {
      const { data } = res

      setUsers(data.users)
      setTeams(data.teams)

      if (jobDetails[field.id].value) {
        const currentActivePerson = JSON.parse(jobDetails[field.id].value).personsAndTeams[0]
        const { id, kind } = currentActivePerson

        if (kind === "person") {
          const activeUser = users.find(user => user.id === id)

          setActivePerson({
            name: activeUser.name,
            src: activeUser.photo_thumb_small,
          })
        }
        if (kind === "team") {
          const activeTeam = teams.find(team => team.id === id)

          setActivePerson({
            name: activeTeam.name,
            src: activeTeam.picture_url,
          })
        }
      }

      setLoading(false)
    }).catch(error => {
      console.log(error)
      setLoading(false)
    })
  }, [field, jobDetails])

  const handleSetActivePerson = person => {
    setActivePerson({
      id: person.id,
      name: person.name,
      src: person.src,
    })
    changeJobEdits({ personsAndTeams: [{ id: person.id, kind: person.kind }]})
    setShowList(!showList)
  }

  return (
    <>
      <Button
        color={Button.colors.PRIMARY}
        kind={Button.kinds.SECONDARY}
        size={Button.sizes.SMALL}
        onClick={() => setShowList(!showList)}
      >
        <Avatar className="list-item-avatar" src={activePerson.src} size="small" type="img" ></Avatar>
        {activePerson.name}
      </Button>
      {showList && (
        <DialogContentContainer
          style={{
            height: "204px",
            position: "absolute",
          }}
        >
          <List
            dense={true}
          >
            {loading ? (
              <Loader
                color="primary"
                size="small"
              />
            ) : (
              <>
                <ListTitle>
                  Users
                </ListTitle>
                {users.map(user => (
                  <ListItem 
                    key={user.id} 
                    size={ListItem.sizes.XXS} 
                    onClick={() => handleSetActivePerson({ id: user.id, name: user.name, src: user.photo_thumb_small, kind: "person" })}
                  >
                    <Avatar className="list-item-avatar" src={user.photo_thumb_small} size="small" type="img" />
                    {user.name}
                  </ListItem>
                ))}
                <ListTitle>
                  Teams
                </ListTitle>
                {teams.map(team => (
                  <ListItem
                    key={team.id}
                    size={ListItem.sizes.XXS}
                    onClick={() => handleSetActivePerson({ id: team.id, name: team.name, src: team.picture_url, kind: "team" })}
                  >
                    <Avatar className="list-item-avatar" src={team.picture_url} size="small" type="img" />
                    {team.name}
                  </ListItem>
                ))}
              </>
            )}
          </List>
        </DialogContentContainer>
      )}
    </>
  )
}

export default People