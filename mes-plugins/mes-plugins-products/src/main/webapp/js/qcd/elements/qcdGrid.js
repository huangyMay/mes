var QCD = QCD || {};
QCD.elements = QCD.elements || {};

QCD.elements.GridElement = function(args) {
	
	// PRIVATE
	
	var gridParameters;
	
	var grid;
	
	var pagingVars = new Object();
		pagingVars.first = null;
		pagingVars.max = null;
		pagingVars.totalNumberOfEntities = null;
	
	var sortVars = new Object();
		sortVars.column = null;
		sortVars.order = null;
		
	var pagingElements = new Object();
		pagingElements.prevButton = null;
		pagingElements.nextButton = null;
		pagingElements.recordsNoSelect = null;
		pagingElements.pageNoSpan = null;
		pagingElements.allPagesNoSpan = null;
		
	var sortElements = new Object();
		sortElements.columnChooser = null;
		sortElements.orderChooser = null;
	
	var navigationButtons = new Object();
		navigationButtons.newButton = null;
		navigationButtons.deleteButton = null;
	
	var parentId = null;
	
	var children = new Array();
	
	
	var defaultOptions = {
		paging: true,
		deleteConfirmMessage: 'delete?'
	};
	
	function parseOptions(opts) {
		if (!opts.element) {
			throw("no element definied");
		}
		for (var opName in defaultOptions) {
			if (opts[opName] == undefined) {
				opts[opName] = defaultOptions[opName];
			}
		}
		return opts;
	}
	
	
	function paging_prev() {
		pagingVars.first -= pagingVars.max;
		if (pagingVars.first < 0) {
			pagingVars.first = 0;
		}
		refresh();
	}

	function paging_next() {
		pagingVars.first += pagingVars.max;
		refresh();
	}

	function paging_onRecordsNoSelectChange() {
		pagingVars.max = parseInt(pagingElements.recordsNoSelect.val());
		refresh();
	}
	
	function performSort() {
		sortVars.column = sortElements.columnChooser.val();
		sortVars.order = sortElements.orderChooser.val();
		refresh();
	}
	
	
	function rowClicked(rowId) {
		for (var i in children) {
			children[i].insertParentId(rowId);
		}
	}
	
	function rowDblClicked(rowId) {
		redirectToCorrespondingPage(rowId);
	}
	
	function newClicked() {
		redirectToCorrespondingPage();
	}
	
	function deleteClicked() {
		deleteSelectedRecords();
	}
	
	redirectToCorrespondingPage = function(rowId) {
		var url = gridParameters.correspondingViewName + ".html";
		if (rowId) {
			url += "?entityId="+rowId;
		}
		window.location = url;
	}
	
	function enable() {
		navigationButtons.newButton.attr("disabled", false);
		navigationButtons.deleteButton.attr("disabled", false);
	}
	
	function disable() {
		navigationButtons.newButton.attr("disabled", true);
		navigationButtons.deleteButton.attr("disabled", true);
	}
	
	function refresh() {
		grid.jqGrid('clearGridData');
		blockList();
		var parameters = new Object();
		if (pagingVars.max) {
			parameters.maxResults = pagingVars.max;
		}
		if (pagingVars.first != null) {
			parameters.firstResult = pagingVars.first;
		}
		if (sortVars.column && sortVars.order) {
			parameters.sortColumn = sortVars.column;
			parameters.sortOrder = sortVars.order;
		}
		if (parentId) {
			parameters.entityId = parentId;
		}
		$.ajax({
			url: gridParameters.viewName+"/"+gridParameters.viewElementName+"/list.html",
			type: 'GET',
			data: parameters,
			dataType: 'json',
			data: parameters,
			contentType: 'application/json; charset=utf-8',
			success: function(response) {
				pagingVars.totalNumberOfEntities = response.totalNumberOfEntities;
				for (var entityNo in response.entities) {
					var entity = response.entities[entityNo];
					grid.jqGrid('addRowData',entity.id,entity.fields);
				}	       
				unblockList();
			},
			error: function(xhr, textStatus, errorThrown){
				alert(textStatus);
				unblockList();
			}

		});
	}
	
	function blockList() {
		grid.block({ message: gridParameters.loadingText, showOverlay: false,  fadeOut: 0, fadeIn: 0,css: { 
            border: 'none', 
            padding: '15px', 
            backgroundColor: '#000', 
            '-webkit-border-radius': '10px', 
            '-moz-border-radius': '10px', 
            opacity: .5, 
            color: '#fff' } });
		if (gridParameters.paging) {
			pagingElements.prevButton.attr("disabled", true);
			pagingElements.nextButton.attr("disabled", true);
			pagingElements.recordsNoSelect.attr("disabled", true);
		}
	}

	function unblockList() {
		grid.unblock();
		paging_refreshBottomButtons();
	}
	
	function paging_refreshBottomButtons() {
		if (gridParameters.paging) {
			if (pagingVars.first > 0) {
				pagingElements.prevButton.attr("disabled", false);
			}
			if (pagingVars.first + pagingVars.max < pagingVars.totalNumberOfEntities) {
				pagingElements.nextButton.attr("disabled", false);
			}
			pagingElements.recordsNoSelect.attr("disabled", false);
			var pagesNo = Math.ceil(pagingVars.totalNumberOfEntities / pagingVars.max);
			if (pagesNo == 0) {
				pagesNo = 1;
			}
			var currPage = Math.ceil(pagingVars.first / pagingVars.max) + 1;
			pagingElements.pageNoSpan.html(currPage);
			pagingElements.allPagesNoSpan.html(pagesNo);
		}
	}
	
	function deleteSelectedRecords() {
		if (window.confirm(gridParameters.deleteConfirmMessage)) {
			blockList();
			var selectedRows;
			if (gridParameters.multiselect) {
				selectedRows = grid.getGridParam("selarrrow");
			} else {
				selectedRows = new Array();
				selectedRows.push(grid.getGridParam('selrow'));
			}
			var dataArray = new Array();
			for (var i in selectedRows) {
				dataArray.push(parseInt(selectedRows[i]));
			}
			var dataString = JSON.stringify(dataArray);
			$.ajax({
				url: gridParameters.viewName+"/"+gridParameters.viewElementName+"/delete.html",
				type: 'POST',
				dataType: 'json',
				data: dataString,
				contentType: 'application/json; charset=utf-8',
				success: function(response) {
					refresh();
				},
				error: function(xhr, textStatus, errorThrown){
					alert(textStatus);
					unblockList();
				}

			});
		}
	}
	
	// CONSTRUCTOR
	
	function constructor(args) {
		
		gridParameters = parseOptions(args);
		
		
		var element = $("#"+gridParameters.element);
		
		var topButtonsDiv = $("<div>").addClass('qcdGrid_top');
			navigationButtons.newButton =  $("<button>").html('new');
			navigationButtons.newButton.click(newClicked);
			navigationButtons.newButton.attr("disabled", true);
			topButtonsDiv.append(navigationButtons.newButton);
			navigationButtons.deleteButton =  $("<button>").html('delete');
			navigationButtons.deleteButton.click(deleteClicked);
			navigationButtons.deleteButton.attr("disabled", true);
			topButtonsDiv.append(navigationButtons.deleteButton);
		element.before(topButtonsDiv);
		
		if (gridParameters.sortable) {
			var topSortDiv = $("<div>").addClass('qcdGrid_sortButtons');
				sortElements.columnChooser = $("<select>");
					for (var i in gridParameters.colNames) {
						var colName = gridParameters.colNames[i];
						sortElements.columnChooser.append("<option value='"+colName+"'>"+colName+"</option>");
					}
					topSortDiv.append(sortElements.columnChooser);
				sortElements.orderChooser = $("<select>");
					sortElements.orderChooser.append("<option value='asc'>asc</option>");
					sortElements.orderChooser.append("<option value='desc'>desc</option>");
					topSortDiv.append(sortElements.orderChooser);
				var sortButton =  $("<button>").html('sort');
					sortButton.click(function() {performSort();});
					topSortDiv.append(sortButton);
			element.before(topSortDiv);
		}
		
		if (gridParameters.paging) {
			var pagingDiv = $("<div>").addClass('qcdGrid_paging');
				pagingElements.prevButton =  $("<button>").html('prev');
				pagingDiv.append(pagingElements.prevButton);
				
				pagingElements.recordsNoSelect = $("<select>");
					pagingElements.recordsNoSelect.append("<option value=10>10</option>");
					pagingElements.recordsNoSelect.append("<option value=20>20</option>");
					pagingElements.recordsNoSelect.append("<option value=50>50</option>");
					pagingElements.recordsNoSelect.append("<option value=100>100</option>");
				pagingDiv.append(pagingElements.recordsNoSelect);
				
				var pageInfoSpan = $("<span>").addClass('qcdGrid_paging_pageInfo');
					pageInfoSpan.append('<span>page</span>');
					pagingElements.pageNoSpan = $("<span>");
					pageInfoSpan.append(pagingElements.pageNoSpan);
					pageInfoSpan.append('<span>/</span>');
					pagingElements.allPagesNoSpan = $("<span>");
					pageInfoSpan.append(pagingElements.allPagesNoSpan);
				pagingDiv.append(pageInfoSpan);
				
				pagingElements.nextButton =  $("<button>").html('next');
				pagingDiv.append(pagingElements.nextButton);
			
				pagingElements.prevButton.click(function() {paging_prev();});
				pagingElements.recordsNoSelect.change(function() {paging_onRecordsNoSelectChange();});
				pagingElements.nextButton.click(function() {paging_next(); });
				
			element.after(pagingDiv);
			
			pagingVars.first = 0;
			pagingVars.max = 10;
		}
		
		gridParameters.datatype = 'local';
		gridParameters.ondblClickRow = function(id){
			rowDblClicked(id);
        }
		gridParameters.onSelectRow = function(id){
			rowClicked(id);
        }
		grid = element.jqGrid(gridParameters);
		
		if (! gridParameters.parent) {
			enable();
			refresh();
		}
	}
	
	this.insertParentId = function(_parentId) {
		parentId = _parentId;
		enable();
		refresh();
	}
	
	this.getParent = function() {
		return gridParameters.parent;
	}
	
	this.addChild = function(child) {
		children.push(child);
	}
	
	constructor(args);
	
};
