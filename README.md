# React Forge Viewer Component

## Motivation
Autodesk provides a web-based viewer that can load and display a wide range of
2D and 3D models (Revit, Navisworks, AutoCAD, etc.).

The `ForgeViewer` component in this package makes it easy to include and
interact with the viewer in your React apps by wrapping the standard Autodesk
libraries in a React-friendly interface.

Note that this component is optimized for what seems to be the most common case
-- one viewer per page, and a single document per viewer. It also assumes you
will take care of generating a valid oAuth token to access Forge, and generate a
URN for you document (via Model Derivative API).

## Supported React Versions
This package requires React 16.4.1 and higher.

## Installation

`npm i react-forge-viewer --save`

## Example
```jsx
import React, { Component } from 'react';
import ForgeViewer from 'react-forge-viewer';
import './App.css';

class App extends Component {

  constructor(props){
    super(props);

    this.state = {
      view:null
    }
  }

  /* after the viewer loads a document, we need to select which viewable to
  display in our component */
  handleDocumentLoaded(doc, viewables){
    if (viewables.length === 0) {
      console.error('Document contains no viewables.');
    }
    else{
      //Select the first viewable in the list to use in our viewer component
      this.setState({view:viewables[0]});
    }
  }

  handleDocumentError(viewer, error){
    console.log('error loading a document');
  }

  handleModelLoaded(viewer, model){
    console.log('Loaded model:', model);
  }

  handleModelError(viewer, error){
    console.log('Error loading the model.');
  }

  getForgeToken(){
    /* Normally, this would call an endpoint on your server to generate a public
    access token (using your client id and sercret). Doing so should yield a
    response that looks something like the following...
    */
    return {
      access_token:<<INSERT_YOUR_FORGE_ACCESS_TOKEN>>,
      expires_in: <<INSERT_TOKEN_EXPIRATION>>,
      token_type: "Bearer"
    };
  }

  /* Once the viewer has initialized, it will ask us for a forge token so it can
  access the specified document. */
  handleTokenRequested(onAccessToken){
    console.log('Token requested by the viewer.');
    if(onAccessToken){
      let token = this.getForgeToken();
      if(token)
        onAccessToken(
          token.access_token, token.expires_in);
    }
  }

  render() {
    return (
      <div className="App">
        <ForgeViewer
          urn=<<INSERT_YOUR_FORGE_DOCUMENT_URN>>
          view={this.state.view}
          onTokenRequest={this.handleTokenRequested.bind(this)}
          onDocumentLoad={this.handleDocumentLoaded.bind(this)}
          onDocumentError={this.handleDocumentError.bind(this)}
          onModelLoad={this.handleModelLoaded.bind(this)}
          onModelError={this.handleModelError.bind(this)}
        />
      </div>
    );
  }
}

export default App;
```

## License
MIT 2018

## Made by Outer Labs, Inc.
[outerlabs.io](http://outerlabs.io)
