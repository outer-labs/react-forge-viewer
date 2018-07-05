import React from 'react';
import Script from 'react-load-script'
import './index.css';

const FORGE_VIEWER_ERROR = {
    /** An unknown failure has occurred. */
    UNKNOWN_FAILURE: 1,

    /** Bad data (corrupted or malformed) was encountered. */
    BAD_DATA: 2,

    /** A network failure was encountered. */
    NETWORK_FAILURE: 3,

    /** Access was denied to a network resource (HTTP 403) */
    NETWORK_ACCESS_DENIED: 4,

    /** A network resource could not be found (HTTP 404) */
    NETWORK_FILE_NOT_FOUND: 5,

    /** A server error was returned when accessing a network resource (HTTP 5xx) */
    NETWORK_SERVER_ERROR: 6,

    /** An unhandled response code was returned when accessing a network resource (HTTP 'everything else') */
    NETWORK_UNHANDLED_RESPONSE_CODE: 7,

    /** Browser error: webGL is not supported by the current browser */
    BROWSER_WEBGL_NOT_SUPPORTED: 8,

    /** There is nothing viewable in the fetched document */
    BAD_DATA_NO_VIEWABLE_CONTENT: 9,

    /** Browser error: webGL is supported, but not enabled */
    BROWSER_WEBGL_DISABLED: 10,

    /** There is no geomtry in loaded model */
    BAD_DATA_MODEL_IS_EMPTY: 11,

    /** Collaboration server error */
    RTC_ERROR: 12
};

class ForgeViewer extends React.Component {

  constructor(props){
    super(props);
    this.state = {urn:null, enable:false, doc:null};
    this.viewerDiv = React.createRef();
    this.viewer = null;
  }

  handleLoadDocumentSuccess(doc) {
    console.log("Forge viewer has successfully loaded a document:", doc);
    this.setState({doc});

    // A document contains references to 3D and 2D viewables.
    let viewables = Autodesk.Viewing.Document.getSubItemsWithProperties(
      doc.getRootItem(), {'type': 'geometry'}, true
    );

    if(this.props.onDocumentLoad)
      this.props.onDocumentLoad(doc, viewables);
  }

  handleLoadDocumentError(errorCode){
    console.error('Error loading Forge document - errorCode:' + errorCode);
    if(this.props.onDocumentError)
      this.props.onDocumentError(errorCode);
  }

  handleLoadModelSuccess(model){
    console.log('Model successfully loaded from Forge.', model);

    if(this.props.onModelLoad)
      this.props.onModelLoad(this.viewer, model);
  }

  handleLoadModelError(errorCode){
    console.error('Error loading Forge model - errorCode:' + errorCode);
    if(this.props.onModelError)
      this.props.onModelError(errorCode);
  }

  handleScriptLoad(){
    console.log('Autodesk scripts have finished loading.');
    this.setState({
      enable:true
    });
  }

  clearDocument(){
    this.setState({doc:null,urn:null});
  }

  loadDocument(urn){
    this.setState({urn});

    let options = {
      env: 'AutodeskProduction',
      getAccessToken: this.props.onTokenRequest
    };

    let documentId = `urn:${urn}`;
    let successHandler = this.handleLoadDocumentSuccess.bind(this);
    let errorHandler = this.handleLoadDocumentError.bind(this);
    let container = this.viewerDiv.current;
    let component = this;

    if (!component.viewer) {
      console.log('Initializing Forge Viewer...');

      Autodesk.Viewing.Initializer(options, function onInitialized() {

        console.log('Forge Viewer successfully initialized.');

        // Create Viewer instance and load model.
        component.viewer = new Autodesk.Viewing.Private.GuiViewer3D(container);

        console.log('Starting the Forge Viewer...');
        var errorCode = component.viewer.start();

        // Check for initialization errors, and let parent know of failure
        if (errorCode){
          console.error('Error starting Forge Viewer - code:', errorCode);
          component.dispatchError(errorCode);
        }
        else{
          console.log('Forge Viewer is loading document:', documentId);
          Autodesk.Viewing.Document.load(
            documentId, successHandler, errorHandler
          );
        }
      });
    }
    else {
      console.log('Forge Viewer is loading document:', documentId);
      Autodesk.Viewing.Document.load(
        documentId, successHandler, errorHandler
      );
    }
  }

  componentDidUpdate(prevProps, prevState){
    //viewer must be both flagged for reload, and enabled to load a document
    if(!this.props.urn || this.props.urn === ''){
      //clear out the previously loaded document
      if(prevState.doc){
        this.clearDocument();
      }
    }
    else if(this.props.urn){
      //propery value does not match state, so load a new doc
      if(this.props.urn != prevState.urn){
        this.loadDocument(this.props.urn);
      }
    }

    if(this.props.view != prevProps.view){
      if(!this.state.doc){
        console.error('Forge Viewer cannot display a view without loading a doc.')
      }
      else{
        let view = this.props.view;
        let svfUrl = this.state.doc.getViewablePath(view);
        let successHandler = this.handleLoadModelSuccess.bind(this);
        let errorHandler = this.handleLoadModelError.bind(this);
        let modelOptions = {
          sharedPropertyDbPath: this.state.doc.getPropertyDbPath()
        };

        //re-initialize viewer, otherwise it will combine models
        this.viewer.tearDown();
        this.viewer.start();

        //load the specified model
        this.viewer.loadModel(
          svfUrl, modelOptions, successHandler, errorHandler
        );
      }
    }
  }

  render() {
    const version = (this.props.version) ? this.props.version: "5.0";

    return (
      <div className="ForgeViewer">
        <div ref={this.viewerDiv}></div>
        <link rel="stylesheet" type="text/css" href={`https://developer.api.autodesk.com/modelderivative/v2/viewers/style.min.css?v=v${version}`}/>
        <Script url={`https://developer.api.autodesk.com/modelderivative/v2/viewers/viewer3D.min.js?v=v${version}`}
          onLoad={this.handleScriptLoad.bind(this)}/>

        {!this.state.doc ?
          <div className="scrim">
            <div className="message">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"></path><polyline points="2.32 6.16 12 11 21.68 6.16"></polyline><line x1="12" y1="22.76" x2="12" y2="11"></line></svg>
            </div>
          </div>
          : null
        }

        {!this.state.enable ?
          <div className="scrim">
            <div className="message">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              <div>Starting Viewer...</div>
            </div>
          </div>
          : null
        }
      </div>
    );
  }
}
export default ForgeViewer;
