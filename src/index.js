import React from 'react';
import Script from 'react-load-script'
import Measure from 'react-measure'
import './index.css';

class ForgeViewer extends React.Component {

  constructor(props){
    super(props);
		this.docs = [];
		this.views = {};
    this.state = {enable:false, error:false, empty:true};
    this.viewerDiv = React.createRef();
    this.viewer = null;
    this.resizeHandling = null;

		//if urn already given when component is created
		if(typeof props.urn != 'undefined' && props.urn != '')
			this.docs.push(props.urn);
  }

  componentWillUnmount(){
    console.log('React Forge Viewer unmounting...')
    if(this.viewer){
      this.viewer.tearDown()
      this.viewer.finish()
      this.viewer = null
      console.log('React Forge Viewer destroyed.')
    }
  }

  handleLoadModelSuccess(model){
    console.log('Model successfully loaded by Forge Viewer.', model);

    if(this.props.onModelLoad)
      this.props.onModelLoad(this.viewer, model);
  }

  handleLoadModelError(errorCode){
    this.setState({error:true});

    console.error('Error loading Forge model - errorCode:' + errorCode);
    if(this.props.onModelError)
      this.props.onModelError(errorCode);
  }

  handleViewerError(errorCode){
    this.setState({error:true});

    console.error('Error loading Forge Viewer. - errorCode:', errorCode);
    if(this.props.onViewerError)
      this.props.onViewerError(errorCode);
  }

  handleScriptLoad(){
    console.log('Autodesk scripts have finished loading.');

		let options = {
			env: 'AutodeskProduction', getAccessToken: this.props.onTokenRequest
		};

		Autodesk.Viewing.Initializer(
			options, this.handleViewerInit.bind(this));
  }

  handleViewerInit(){
    console.log('Forge Viewer has finished initializing.');

    let container = this.viewerDiv.current;

    // Create Viewer instance so we can load models.
    if (this.props.headless) {
      this.viewer = new Autodesk.Viewing.Viewer3D(container);
    } else {
      this.viewer = new Autodesk.Viewing.Private.GuiViewer3D(container);
    }

    console.log('Starting the Forge Viewer...');
    var errorCode = this.viewer.start();
    if (!errorCode){
			console.log('Forge Viewer has successfully started.');
			this.setState({enable:true});
			this.reviewDocuments();
		} else{
      console.error('Error starting Forge Viewer - code:', errorCode);
      this.handleViewerError(errorCode);
    }
  }

	handleLoadDocumentSuccess(doc) {
		console.log("Forge viewer has successfully loaded document:", doc);

		let views = Autodesk.Viewing.Document.getSubItemsWithProperties(
			doc.getRootItem(), {'type': 'geometry'}, true
		);

		//augment viewables with the doc they came from
		views.forEach(viewable => {
			viewable.doc = doc;
		})

		//raise an event so caller can select a viewable to display
		if(this.props.onDocumentLoad)
			this.props.onDocumentLoad(doc, views);
	}

	handleLoadDocumentError(errorCode){
		this.setState({error:true});

		console.error('Error loading Forge document - errorCode:' + errorCode);
		if(this.props.onDocumentError)
			this.props.onDocumentError(errorCode);
	}

	clearErrors(){
	  this.setState({error:false});
	}

	clearViews(){
		console.log('clearing all views.');
		this.views = {};
		if(this.viewer){
			//restart viewer, for lack of ability to unload models
			this.viewer.tearDown();
			this.viewer.start();
		}
	}

	reviewDocuments(){
		if(this.viewer){
			this.clearErrors();
			console.log('reviewing documents...');
			//let keys = Object.keys(this.docs);
			this.setState({empty:(this.docs.length == 0)});
			this.docs.forEach(urn => {
				this.loadDocument(urn);
			});
		}
	}

  loadDocument(urn){
		console.log('Forge Viewer is loading document:', urn);

    let documentId = `urn:${urn}`;
    let successHandler = this.handleLoadDocumentSuccess.bind(this);
    let errorHandler = this.handleLoadDocumentError.bind(this);

    Autodesk.Viewing.Document.load(
      documentId, successHandler, errorHandler
    );
  }

	loadView(view){
		console.log('loading view:', view.viewableID);
		this.views[view.viewableID] = view;

		let svfUrl = view.doc.getViewablePath(view);
		let successHandler = this.handleLoadModelSuccess.bind(this);
		let errorHandler = this.handleLoadModelError.bind(this);
		let modelOptions = {
			sharedPropertyDbPath: view.doc.getPropertyDbPath()
		};

		//load the specified model
		this.viewer.loadModel(
			svfUrl, modelOptions, successHandler, errorHandler
		);
	}

	isArrayDifferent(current, next){
		if(current == null && next == null)
			return false;
		else if (current == null || next == null)
			return true;
		else if(current.length != next.length)
			return true;

		for(var i = 0; i < current.length; i++)
			if(current[i] != next[i])
				return true;
		return false;
	}

	shouldComponentUpdateURN(nextProps, nextState){
		//console.log('props urn:', this.props.urn, ' next props urn:', nextProps.urn)
		//new urn is null, empty or empty array
    if(!nextProps.urn || nextProps.urn === '' || typeof nextProps.urn === 'undefined' ||
			(Array.isArray(nextProps.urn) && nextProps.urn.length == 0)){
      //clear out views if any document was previously loaded
			if(this.docs.length > 0){
				this.setDocuments([]);
			}
    } else if(Array.isArray(nextProps.urn)){
			//always have to check array because equivalence is per element
			if(this.isArrayDifferent(this.props.urn, nextProps.urn)){
				this.setDocuments(nextProps.urn);
			}
		} else if(nextProps.urn != this.props.urn){
			this.setDocuments([nextProps.urn]);
		}
	}

	shouldComponentUpdateView(nextProps, nextState){
		//the view property is empty, undefined, or empty array
		if(!nextProps.view || typeof nextProps.view === 'undefined' ||
			(Array.isArray(nextProps.view) && nextProps.view.length == 0)){
			if(Object.keys(this.views).length > 0)
				this.clearViews();
		} else if(Array.isArray(nextProps.view)){
			if(this.isArrayDifferent(this.props.view, nextProps.view)){
				this.setViews(nextProps.view);
			}
		} else if(this.props.view != nextProps.view){
			this.setViews([nextProps.view]);
    }
	}

	shouldComponentUpdate(nextProps, nextState){
		this.shouldComponentUpdateURN(nextProps, nextState);
		this.shouldComponentUpdateView(nextProps, nextState);
		return true;
	}

	setDocuments(list){
		this.docs = list;
		this.clearViews();
		this.reviewDocuments(); //defer loading until viewer ready
	}

	setViews(list){
		//check to see if views were added or removed from existing list
		let existing = Object.assign({},this.views);
		let incremental = [];
		list.forEach(view => {
			if(existing.hasOwnProperty(view.viewableID))
				//the view was previously in the list
				delete existing[view.viewableID];
			else {
				//the view is newly added to the list
				incremental.push(view);
			}
		});

		//anything left in old's keys should be unloaded
		let keys = Object.keys(existing);
		if(keys.length > 0){
			//views were removed, so restart viewer for lack of 'unload'
			this.viewer.tearDown();
			this.viewer.start();
			list.forEach(view => {
				this.loadView(view);
			});
		} else{
			//load views incrementally rather than a complete teardown
			incremental.forEach(view => {
				this.loadView(view);
			});
		}
	}

  handleResize(rect){
    //cancel any previous handlers that were dispatched
    if(this.resizeHandling)
      clearTimeout(this.resizeHandling)

    //defer handling until resizing stops
    this.resizeHandling = setTimeout(() => {
      if(this.viewer) this.viewer.resize()
    }, 100)
  }

  render() {
    const version = (this.props.version) ? this.props.version: "6.0";

    return (
      <Measure bounds onResize={this.handleResize.bind(this)}>
        {({ measureRef }) =>
        <div ref={measureRef} className="ForgeViewer">
          <div ref={this.viewerDiv}></div>
          <link rel="stylesheet" type="text/css" href={`https://developer.api.autodesk.com/modelderivative/v2/viewers/style.min.css?v=v${version}`}/>
          <Script url={`https://developer.api.autodesk.com/modelderivative/v2/viewers/viewer3D.min.js?v=v${version}`}
            onLoad={this.handleScriptLoad.bind(this)}
            onError={this.handleViewerError.bind(this)}
          />

          {this.state.empty &&
            <div className="scrim">
              <div className="message">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"></path><polyline points="2.32 6.16 12 11 21.68 6.16"></polyline><line x1="12" y1="22.76" x2="12" y2="11"></line></svg>
              </div>
            </div>
          }

          {this.state.error &&
            <div className="scrim">
              <div className="message">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12" y2="16"></line></svg>
                <div>Viewer Error</div>
              </div>
            </div>
          }

          {!this.state.enable &&
            <div className="scrim">
              <div className="message">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                <div>Starting Viewer...</div>
              </div>
            </div>
          }
        </div>
        }
      </Measure>
    );
  }
}
export default ForgeViewer;
