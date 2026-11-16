# LDSscoreboard

Control **LDSscoreboard v3.26.1** from [Large Display Solutions](https://www.largedisplaysolutions.com/) via its HTTP API.

Official API documentation:  
https://www.largedisplaysolutions.com/fr/introduction-aux-logiciels-de-tableaux-daffichage-sportif/documentation-de-lapi-http/

## Configuration

- **IP Address**: IP of the computer running LDSscoreboard (default `127.0.0.1`)
- **Port**: HTTP port configured in the software (default `8086`)
- **Refresh interval**: Time between automatic refreshes of variables and lists (default `60` seconds)
- **Update timers every second**: When enabled, timer values are refreshed every second

## Features

- Dynamic actions and presets for slides, counters, timers, labels, vectors, buttons and roster
- Automatic variables updated from the API
- Fast polling for timers (optional, 1 second)
- Immediate targeted refresh after actions (50 ms delay)
- Vector support using length from `list_vectors`
- Custom buttons support
- Reset active scoreboard

## Variables

- Team: `local_team_name`, `guest_team_name`, `local_team_score`, `guest_team_score`, `local_team_fauls`, `guest_team_fauls`
- Counters: `counter_<name>`
- Timers: `timer_<name>`
- Labels: `label_<name>`
- Vectors: `vector_<id>_length`, `vector_<id>_<index>`
- Players: `player_local_<index>_score`, `player_local_<index>_faults`, `player_local_<index>_cautions` (and guest)
- Counts: `players_local`, `players_guest`

## Developer

**Le Comte Brice**  
SAS BLC  
Website: [www.blc-tech.fr](https://www.blc-tech.fr)  
Email: brice@blc-tech.fr

## Notes

All actions send simple HTTP GET requests.  
Responses are JSON envelopes (`status`, `message`, `result`).  
Make sure the Companion computer can reach the LDSscoreboard PC on the network.
