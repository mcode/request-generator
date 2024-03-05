import React, { useEffect, useState } from 'react';
import './card-list.css';
import { Button, Card, CardActions, CardContent, Typography } from '@mui/material';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { retrieveLaunchContext } from '../../util/util';
import './displayBox.css';

const DisplayBox = (props) => {

  const [state, setState] = useState({ smartLink: '', response: {}});
  const { isDemoCard, fhirAccessToken, ehrLaunch, patientId, client, response } = props;

  useEffect(() => {
    if (response !== state.response) {
      setState(prevState => ({...prevState, response: response}));
    }
  }, [response]);

  const supportedRequestType = (resource) => {
    let resourceType = resource.resourceType.toUpperCase();
    if (
      resourceType === 'DEVICEREQUEST' ||
      resourceType === 'SERVICEREQUEST' ||
      resourceType === 'MEDICATIONREQUEST' ||
      resourceType === 'MEDICATIONDISPENSE'
    ) {
      return true;
    }
  };
  /**
   * Take a suggestion from a CDS service based on action on from a card. Also pings the analytics endpoint (if any) of the
   * CDS service to notify that a suggestion was taken
   * @param {*} suggestion - CDS service-defined suggestion to take based on CDS Hooks specification
   * @param {*} url - CDS service endpoint URL
   */
  const takeSuggestion = (suggestion, url, buttonId, suggestionCount, cardNum, selectionBehavior) => {
    if (!isDemoCard) {
      if (selectionBehavior === 'at-most-one') {
        // disable all suggestion buttons for this card
        for (var i = 0; i < suggestionCount; i++) {
          let bId = 'suggestion_button-' + cardNum + '-' + i;
          document.getElementById(bId).setAttribute('disabled', 'true');
        }
      } else {
        // disable this suggestion button if any are allowed
        const element = document.getElementById(buttonId);
        element.setAttribute('disabled', 'true');
        element.setAttribute('style', 'background-color:#4BB543;');
      }

      if (suggestion.label) {
        if (suggestion.uuid) {
          axios({
            method: 'POST',
            url: `${url}/analytics/${suggestion.uuid}`,
            data: {}
          });
        }

        // handle each action from the suggestion
        var uri = '';
        suggestion.actions.forEach(action => {
          if (action.type.toUpperCase() === 'DELETE') {
            uri = action.resource.resourceType + '/' + action.resource.id;
            console.log('completing suggested action DELETE: ' + uri);
            client.delete(uri).then(result => {
              console.log('suggested action DELETE result:');
              console.log(result);
            });
          } else if (action.type.toUpperCase() === 'CREATE') {
            uri = action.resource.resourceType;
            console.log('completing suggested action CREATE: ' + uri);
            client.create(action.resource).then(result => {
              console.log('suggested action CREATE result:');
              console.log(result);

              if (supportedRequestType(result)) {
                // call into the request builder to resubmit the CRD request with the suggested request
                takeSuggestion(result);
              }
            });
          } else if (action.type.toUpperCase() === 'UPDATE') {
            uri = action.resource.resourceType + '/' + action.resource.id;
            console.log('completing suggested action UPDATE: ' + uri);
            client.update(action.resource).then(result => {
              console.log('suggested action UPDATE result:');
              console.log(result);
            });
          } else {
            console.log('WARNING: unknown action');
          }
        });
      } else {
        console.error('There was no label on this suggestion', suggestion);
      }
    }
  };

  /**
   * Prevent the source link from opening in the same tab
   * @param {*} e - Event emitted when source link is clicked
   */
  const launchSource = (e, link)  => {
    e.preventDefault();
    window.open(link.url, '_blank');
  };

  const exitSmart = (e) => {
    setState(prevState => ({...prevState, smartLink: ''}));
  };
  /**
   * Open the absolute or SMART link in a new tab and display an error if a SMART link does not have
   * appropriate launch context if used against a secured FHIR endpoint.
   * @param {*} e - Event emitted when link is clicked
   * @param {*} link - Link object that contains the URL and any error state to catch
   */
  const launchLink = (e, link) => {
    if (!isDemoCard) {
      e.preventDefault();
      if (link.error) {
        // TODO: Create an error modal to display for SMART link that cannot be launched securely
        return;
      }
      window.open(link.url, '_blank');
    }
  };

  /**
   * For SMART links, modify the link URLs as this component processes them according to two scenarios:
   * 1 - Secured: Retrieve a launch context for the link and append a launch and iss parameter for use against secured endpoints
   * 2 - Open: Append a fhirServiceUrl and patientId parameter to the link for use against open endpoints
   * @param {*} card - Card object to process the links for
   */
  const modifySmartLaunchUrls = (card) => {
    if (!isDemoCard) {
      return card.links.map(link => {
        let linkCopy = Object.assign({}, link);

        if (
          link.type === 'smart' &&
          (fhirAccessToken || ehrLaunch) &&
          !state.smartLink
        ) {
          retrieveLaunchContext(linkCopy, patientId, client.state).then(
            result => {
              linkCopy = result;
              return linkCopy;
            }
          );
        } else if (link.type === 'smart') {
          if (link.url.indexOf('?') < 0) {
            linkCopy.url += '?';
          } else {
            linkCopy.url += '&';
          }
          //linkCopy.url += `fhirServiceUrl=${this.props.fhirServerUrl}`;
          //linkCopy.url += `&patientId=${this.props.patientId}`;
        }
        return linkCopy;
      });
    }
    return undefined;
  };

  /**
   * Helper function to build out the UI for the source of the Card
   * @param {*} source - Object as part of the card to build the UI for
   */
  const renderSource = (source) => {
    if (!source.label) {
      return null;
    }
    let icon;
    if (source.icon) {
      icon = (
        <img
          className={'card-icon'}
          src={source.icon}
          alt="Could not fetch icon"
          width="100"
          height="100"
        />
      );
    }
    if (!isDemoCard) {
      return (
        <div className="card-source">
          Source:{' '}
          <a
            className="source-link"
            href={source.url || '#'}
            onClick={e => launchSource(e, source)}
          >
            {source.label}
          </a>
          {icon}
        </div>
      );
    }
    return (
      <div className="card-source">
        Source:
        <a className="source-link" href="#" onClick={e => launchSource(e, source)}>
          {source.label}
        </a>
        {icon}
      </div>
    );
  };

  const renderCards = () => {
    let buttonList = [];
    const indicators = {
      info: 0,
      warning: 1,
      'hard-stop': 2,
      error: 3
    };

    const summaryColors = {
      info: '#0079be',
      warning: '#ffae42',
      'hard-stop': '#c00',
      error: '#333'
    };
    const renderedCards = [];

    // Iterate over each card in the cards array
    if (state.response != null && state.response.cards != null) {
      state.response.cards
        .sort((b, a) => indicators[a.indicator] - indicators[b.indicator])
        .forEach((c, cardInd) => {
          const card = JSON.parse(JSON.stringify(c));

          // -- Summary --
          const summarySection = <p>{card.summary}</p>;

          // -- Source --
          const sourceSection =
            card.source && Object.keys(card.source).length ? renderSource(card.source) : '';

          // -- Detail (ReactMarkdown supports Github-flavored markdown) --
          const detailSection = card.detail ? (
            <div>
              <ReactMarkdown source={card.detail} />
            </div>
          ) : (
            <p style={{ color: 'grey' }}>None</p>
          );

          // -- Suggestions --
          let suggestionsSection = [];
          if (card.suggestions) {
            card.suggestions.forEach((item, ind) => {
              var buttonId = 'suggestion_button-' + cardInd + '-' + ind;
              buttonList.push(buttonId);

              suggestionsSection.push(
                <Button
                  key={ind}
                  onClick={() =>
                    takeSuggestion(
                      item,
                      card.serviceUrl,
                      buttonId,
                      card.suggestions.length,
                      cardInd,
                      card.selectionBehavior
                    )
                  }
                  variant="contained"
                  id={buttonId}
                >
                  {item.label}
                </Button>
              );
            });
          }

          // -- Links --
          let linksSection;
          if (card.links) {
            card.links = modifySmartLaunchUrls(card) || card.links;
            linksSection = card.links.map((link, ind) => {
              if (link.type === 'smart') {
                return (
                  <Button key={ind} variant="outlined" onClick={e => launchLink(e, link)}>
                    {link.label}
                  </Button>
                );
              }
              const pdfIcon = <PictureAsPdfIcon />;
              return (
                <Button key={ind} onClick={e => launchLink(e, link)} endIcon={pdfIcon}>
                  {link.label}
                </Button>
              );
            });
          }

          const cardSectionHeaderStyle = { marginBottom: '2px', color: 'black' };

          const builtCard = (
            <Card variant="outlined" key={cardInd} className="decision-card alert-info">
              <React.Fragment>
                <CardContent>
                  <Typography style={cardSectionHeaderStyle} gutterBottom>
                    Summary
                  </Typography>
                  <Typography variant="h5" component="div">
                    {summarySection}
                  </Typography>
                  <br />
                  <Typography style={cardSectionHeaderStyle} gutterBottom>
                    Details
                  </Typography>
                  <Typography variant="div">{detailSection}</Typography>
                  <br />
                  <Typography variant="div" gutterBottom>
                    {sourceSection}
                  </Typography>
                </CardContent>
                <CardActions className={'links-section'}>{linksSection}</CardActions>
                <CardActions>{suggestionsSection}</CardActions>
              </React.Fragment>
            </Card>
          );

          renderedCards.push(builtCard);
        });
      return (
        <div>
            { renderedCards.length === 0 ? <div>Notification Cards ({renderedCards.length})</div> : <></>}
          <div>{renderedCards}</div>
        </div>
      );
    }
  };

  return (
    <div>
      {renderCards()}
    </div>
  );
};

export default DisplayBox;
