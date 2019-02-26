# React Forge Viewer Component

## Motivation
Autodesk provides a web-based viewer that can load and display a wide range of 2D and 3D models (Revit, Navisworks, AutoCAD, etc.).

The `ForgeViewer` component in this package makes it easy to include and interact with the viewer in your React apps by wrapping the standard Autodesk libraries in a React-friendly interface.

Note that this component is not authored by Autodesk.

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

  handleViewerError(error){
    console.log('Error loading viewer.');
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
    console.log('Error loading a document');
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
          version="6.0"
          urn=<<INSERT_YOUR_FORGE_DOCUMENT_URN>>
          view={this.state.view}
          headless={false}
          onViewerError={this.handleViewerError.bind(this)}
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

## Component Parameters

* _urn_: (Required) A string or array of string values for the URN(s) of the translated models you wish to load
* _view_: (Required) An object or array of view objects to display in the viewer
* _headless_: A boolean to display in the viewer in headless mode or not (defaults `false`)
* _proxy_: A string that is the base url to proxy our requests through a
  proxy. This is useful when you don't want to pass an access token to the
client. For [more
info...](https://forge.autodesk.com/blog/securing-your-forge-viewer-token-behind-proxy)
* _onTokenRequest_: (Required) Callback function triggered when the viewer requests a token to access data stored on Forge. Must be a public / viewable scoped token.
* _version_: The version of the viewer you want to load. Latest tested is 6.0.
* _onViewerError_: Callback function triggered when the viewer encounters an error
* _onDocumentLoad_: Callback function triggered when the viewer successfully loads one of the documents (urns) provided
* _onDocumentError_: Callback function triggered when the viewer fails to load one of the documents(urns) provided
* _onModelLoad_: Callback function triggered when the viewer successfully loads one of the models(views) provided
* _onModelError_: Callback function triggered when the viewer fails to load one of the models(views) provided

## Styling the Component
The ForgeViewer component will need to be assigned width and height properties, either directly, or via layout manager (like flex layout).

```css
.App {
  width:100%;
  height:100%;
  position:fixed;
}

.ForgeViewer{
  width:500px;
  height:500px;
}
```

## Run a Development Build of this Component
Since this is a component, it is convenient to test it locally in an app before building and publishing a modified version to npm. Below are the steps to set this up in a development environment:

Clone this repo to your local dev environment
```bash
cd ~/Documents/code
git clone https://github.com/outer-labs/react-forge-viewer.git
```

Install dependencies, and establish a link to our package in npm
```bash
npm i
npm run build
sudo npm link
```

Install and use `create-react-app` to set up a boilerplate app for testing the component (targeting node version 6.10)
```bash
npm i -g create-react-app
cd ~/Documents/code
mkdir my-test-app
cd my-test-app
nvm use 6.10
create-react-app .
echo 'v6.10' > .nvmrc
```

Use the component link with the test app we just created
```bash
sudo npm link react-forge-viewer
```

Add the component to your `App.js` then run `npm start` (for both `my-test-app` and `react-forge-viewer` in separate terminal windows/tabs).

## License
MIT

## Made by Outer Labs, Inc.
* Contact info@outerlabs.io
* Source code for this component is on [GitHub](https://github.com/outer-labs/react-forge-viewer)
* More at [outerlabs.io](http://outerlabs.io)
