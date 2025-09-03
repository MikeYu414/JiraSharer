var ConfigPage = (function (ConfigPage) {
    var _pageVariables = {
        datagridId: "#datagrid",
        btn_add: "#btn_add",
        btn_cancel: "#btn_cancel",
        btn_close: "#btn-close",
        groupname: "#groupname",
        robot: "#robot",
        search: "#search",
        btn_open: "#btn_open",
        dialog: "#dialog",
        dialogBG: "#dialog_background",
        isrun: false,
        issort: false,
        isRefresh: false
    };

    var _const = {
        getGroupUrl: "https://tellmetestmyinfobiz.azurewebsites.net/getgroups",
        addGroupUrl: "https://tellmetestmyinfobiz.azurewebsites.net/addgroups",
        deleteGroupUrl: "https://tellmetestmyinfobiz.azurewebsites.net/deletegroups",
        updateGroupUrl: "https://tellmetestmyinfobiz.azurewebsites.net/updategroups",
        downloadUrl: "https://tellmetestmyinfobiz.azurewebsites.net/JiraSharer",
        downloadUrl105: "https://tellmetestmyinfobiz.azurewebsites.net/JiraSharer1_0_5",
    }

    var pagerdata = {
        pageCount: 1,
        pageNumber: 1,
        pageSize: 20,
        totalItem: 0
    };

    var _dataFun = {
        actionFormatter: function (value, row, rowIndex) {
            var activeBtn = '';
            if (row.status == 1) {
                activeBtn = '<a href="#" onclick="ConfigPage.eventHandler.changeStatus(' + row.id + ', \'inactive\')" class="easyui-linkbutton" iconCls="icon-no">Inactive</a>';
            } else {
                activeBtn = '<a href="#" onclick="ConfigPage.eventHandler.changeStatus(' + row.id + ', \'active\')" class="easyui-linkbutton" iconCls="icon-ok">Active</a>';
            }

            return activeBtn + ' ' +
                '<a href="#" onclick="ConfigPage.eventHandler.deleteItem(' + row.id + ')" class="easyui-linkbutton" iconCls="icon-cancel">Delete</a>';
        },
        dateFormatter: function (value, row, rowIndex) {
            if (value) {
                return new Date(value).toLocaleDateString() + "  " + new Date(value).toLocaleTimeString();
            }
            return "";
        },
        statusFormatter: function (value, row, rowIndex) {
            if (value == 1) {
                return "Active";
            } else if (value == 0) {
                return "Inactive";
            }
        },
        webhookFormatter: function (value, row, rowIndex) {
            if (value && value.length > 30) {
                var temp = value.substring(0, value.length - 30) + "**********"
                return temp;
            }
            return value;
        },
        generalFieldFormatter: function (value, row, rowIndex) {
            var tempV = value;
            if (row.formattedValues && typeof (value) == "number") {
                for (const key in row) {
                    const value = row[key];
                    if (value == tempV) {
                        tempV = row.formattedValues[key] || tempV;
                        break;
                    }
                }
            }
            if (tempV && typeof tempV === 'object') {
                var tempValue = _dataProvider.defendXssStrFormat(tempV.name);
                if (!tempV.readOnly && tempV.logicalName && tempV.id) {
                    if (!tempValue) {
                        tempValue = 'undefined';
                    }
                    var url = AVESDK.XRM.getServerURL() + "/main.aspx?etn=" + tempV.logicalName + "&pagetype=entityrecord&histKey=genericap&newWindow=true&id=" + value.id;
                    var htmlTxt = "<a href='" + url + "' style='text-decoration:underline' title='" + tempValue + "' target='_blank' >" + tempValue + "</a>";
                    return htmlTxt;
                }
                if (tempValue) {
                    return "<div title='" + tempValue + "'>" + tempValue + "</div>";
                }
            }
            var v = _dataFun.defendXssStrFormat(tempV);
            if (v) {
                return "<div title='" + v + "'>" + v + "</div>";
            }
        },
        defendXssStrFormat: function (str) {
            if (str && typeof str === 'string') {
                return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            } else {
                return str;
            }
        },
    }

    var _v = {
        totalData: [],
        columns: [
            [{
                    field: "name",
                    title: "Group Name",
                    width: 120,
                    sortable: true,
                    formatter: _dataFun.generalFieldFormatter
                },
                {
                    field: "robot",
                    title: "Robot Webhook",
                    width: 200,
                    sortable: true,
                    formatter: _dataFun.webhookFormatter
                },
                {
                    field: "status",
                    title: "Status",
                    width: 50,
                    sortable: true,
                    formatter: _dataFun.statusFormatter
                },
                {
                    field: "createon",
                    title: "Created On",
                    width: 100,
                    sortable: true,
                    formatter: _dataFun.dateFormatter
                },
                {
                    field: "action",
                    title: "Action",
                    width: 100,
                    sortable: false,
                    formatter: _dataFun.actionFormatter
                }
            ]
        ]
    }
    
    var _eventHandler = {
        loadAllData: function (callback) {
            $.get(_const.getGroupUrl, function (res) {
                _v.totalData = res;
                callback(res);
            }, 'json');
        },
        addGroup: function () {
            var group = $(_pageVariables.groupname).val();
            var robot = $(_pageVariables.robot).val();
            if (!group || !robot) {
                alert("Group Name or Robot Webhook can not be empty.");
                return;
            }
            group = group.trim();
            robot = robot.trim();
            if (!group || !robot) {
                alert("Group Name or Robot Webhook can not be empty.");
                return;
            }
            // var reg = /^https:\/\/qyapi\.weixin\.qq\.com\/cgi-bin\/webhook\/send\?key=*/;
            // if (!reg.test(robot)) {
            //     alert("Add Failed!\nRobot Webhook like this:\nhttps://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...");
            //     return;
            // }
            for (let index = 0; index < _v.totalData.length; index++) {
                const element = _v.totalData[index];
                if (element && element.robot == robot) {
                    alert(`Add Failed!\nThe robot already exists.`);
                    return;
                }
            }
            var data = {
                name: group,
                robot,
                status: 1
            };
            $.post(_const.addGroupUrl, data, function (res) {
                if (res) {
                    alert("Succeed.");
                    _f.showDialog(false);
                    _f.refreshFunction(true);
                }
            }, 'json');
        },
        deleteItem(id) {
            $.messager.confirm('Confirm', 'Are you sure to delete this record?', function (r) {
                if (r) {
                    $.post(_const.deleteGroupUrl, {
                        id: id
                    }, function (res) {
                        if (res) {
                            alert("Delete Succeed.");
                            _eventHandler.loadAllData(_f.loadEasyUIDGData);
                        }
                    }, 'json');
                }
            });
        },
        changeStatus(id, newStatus) {
            var action = newStatus == 'active' ? 'Active' : 'Inactive';
            var actionValue = newStatus == 'active' ? 1 : 0;
            $.messager.confirm('Confirm', `Are you sure to ${action} this record?`, function (r) {
                if (r) {
                    $.post(_const.updateGroupUrl, {
                        id: id,
                        status: actionValue
                    }, function (res) {
                        if (res) {
                            alert(`${action} Succeed.`);
                            _eventHandler.loadAllData(_f.loadEasyUIDGData);
                        }
                    }, 'json');
                }
            });
        },
        searchData(value) {
            if (value) {
                //var tempArr = [..._v.totalData];
                var tempArr = _v.totalData.filter(el => {
                    return el.name.toString().toLowerCase().includes(value.toLowerCase());
                });
                _f.loadEasyUIDGData(tempArr);
            } else {
                _f.loadEasyUIDGData(_v.totalData);
            }
        }
    }

    var _f = {
        initPage: function () {
            $("#download").attr("href", _const.downloadUrl);
            $("#download105").attr("href", _const.downloadUrl105);
            $(_pageVariables.search).searchbox({
                searcher: _eventHandler.searchData
            });
            _f.initDatagrid();
            _f.initEvent();
            _f.initPager();
            _eventHandler.loadAllData(_f.loadEasyUIDGData);
        },
        initPager: function () {
            var pager = $(_pageVariables.datagridId).datagrid('getPager');
            pager.pagination({
                displayMsg: "{from} - {to} of {total}items",
                onSelectPage: function (pageNum, pageSize) {
                    if (_pageVariables.isRefresh) {
                        _pageVariables.isRefresh = false;
                    } else {
                        _pageVariables.isrun = true;
                        pagerdata.pageNumber = pageNum;
                        pagerdata.pageSize = pageSize;
                        var gridOpts = $(_pageVariables.datagridId).datagrid('options');
                        gridOpts.pageNumber = pageNum;
                        gridOpts.pageSize = pageSize;
                        pager.pagination('refresh', {
                            pageNumber: pageNum,
                            pageSize: pageSize
                        });
                        $(_pageVariables.datagridId).datagrid('loadData', _v.totalData);
                    }
                },
                onBeforeRefresh: function () {
                    _f.refreshFunction(true);
                }
            });
        },

        initEvent: function () {
            $(_pageVariables.btn_open).click(function () {
                _f.showDialog(true);
            });
            $(_pageVariables.btn_add).click(_eventHandler.addGroup);
            $(_pageVariables.btn_close).click(function () {
                _f.showDialog(false);
            });
            $(_pageVariables.btn_cancel).click(function () {
                _f.showDialog(false);
            });
        },

        loadEasyUIDGData: function (data) {
            _pageVariables.isrun = true;
            var dgDataSource = {};
            dgDataSource.rows = data;
            $(_pageVariables.datagridId).datagrid('loading');
            $(_pageVariables.datagridId).datagrid('loadData', data);
            $(_pageVariables.datagridId).datagrid('loaded');
        },

        initDatagrid: function () {
            var op = {
                columns: _v.columns,
                singleSelect: true,
                border: true,
                fit: true,
                multiSort: false,
                fitColumns: true,
                remoteSort: false,
                striped: true,
                sortName: "name",
                sortOrder: "asc",
                pagination: true,
                onSortColumn: function (sort, order) {
                    var tempdg = $(this);
                    var temppager = tempdg.datagrid('getPager');
                    temppager.pagination('refresh', {
                        pageNumber: 1,
                    });
                    pagerdata.pageNumber = 1;
                    _pageVariables.isrun = true;
                    _pageVariables.issort = true;
                    tempdg.datagrid('loadData', _v.totalData);
                },
                onBeforeSortColumn: function (sort, order) {
                    $(_pageVariables.datagridId).datagrid('loadData', _v.totalData);
                },
                loadFilter: _f.pagerFilter,
                pageSize: pagerdata.pageSize,
                rownumbers: true,
                onLoadSuccess: function () {
                    $('.easyui-linkbutton').linkbutton();
                }
            };
            $(_pageVariables.datagridId).datagrid(op);
        },

        refreshFunction: function (isrefresh) {
            if (isrefresh == true) {
                _pageVariables.isRefresh = true;
            }
            _eventHandler.loadAllData(_f.loadEasyUIDGData);
        },

        pagerFilter: function (data) {
            if ($.isArray(data)) { // is array
                data = {
                    total: data.length,
                    rows: data
                }
            }
            if (_pageVariables.isrun == true) {
                var fields = $(this).datagrid('getColumnFields', true).concat($(this).datagrid('getColumnFields', false));
                $.map(data.rows, function (row) {
                    for (var i = 0; i < fields.length; i++) {
                        var v = row[fields[i]];
                        if (v && typeof (v) === "string") {
                            v = v.replace(/</g, '&lt;');
                            v = v.replace(/>/g, '&gt;');
                            row[fields[i]] = v;
                        }
                    }
                });
                var dg = $(this);
                var state = dg.data('datagrid');
                var opts = dg.datagrid('options');
                if (data.originalRows) {
                    state.allRows = data.originalRows;
                } else {
                    state.allRows = (data.rows);
                }
                if (!data.originalRows || _pageVariables.issort) {
                    _pageVariables.issort = false;
                    if (!opts.remoteSort && opts.sortName) {
                        var names = opts.sortName.split(',');
                        var orders = opts.sortOrder.split(',');
                        state.allRows.sort(function (r1, r2) {
                            var r = 0;
                            for (var i = 0; i < names.length; i++) {
                                var sn = names[i];
                                var so = orders[i];
                                var col = dg.datagrid('getColumnOption', sn);
                                var sortFunc = col.sorter || function (a, b) {
                                    return a == b ? 0 : (a > b ? 1 : -1);
                                };
                                r = sortFunc(r1[sn], r2[sn]) * (so == 'asc' ? 1 : -1);
                                if (r != 0) {
                                    return r;
                                }
                            }
                            return r;
                        });
                    }
                }
                if (!data.originalRows) {
                    data.originalRows = (data.rows);
                }
                var start = (pagerdata.pageNumber - 1) * parseInt(pagerdata.pageSize);
                var end = start + parseInt(pagerdata.pageSize);
                data.rows = state.allRows.slice(start, end);
                if (data.rows.length == 0 && pagerdata.pageNumber != 1) {
                    pagerdata.pageNumber = pagerdata.pageNumber - 1;
                    var previousStart = (pagerdata.pageNumber - 1) * parseInt(pagerdata.pageSize);
                    var previousEnd = previousStart + parseInt(pagerdata.pageSize);
                    data.rows = state.allRows.slice(previousStart, previousEnd);
                }
                _pageVariables.isrun = false;
            }
            return data;
        },

        errorHandler: function (error, noAlert) {
            debugger;
            var errOoutput = error;
            if (error.message) {
                errOoutput = error.message;
            } else if (error.faultString) {
                errOoutput = error.faultString;
            }
            if (noAlert) {
                console.error(error);
            } else {
                alert("err: " + errOoutput);
            }
        },

        showTip: function (tip) {
            $.messager.show({
                title: 'Tip',
                msg: tip,
                timeout: 3000,
                showType: 'show',
                style: {
                    right: '',
                    top: document.body.scrollTop + document.documentElement.scrollTop,
                    bottom: '',
                    //"border-radius": 25
                }
            });
        },

        showDialog: function (ifShow) {
            if (ifShow) {
                $(_pageVariables.dialog).show();
                $(_pageVariables.dialogBG).show();
            } else {
                $(_pageVariables.dialog).hide();
                $(_pageVariables.dialogBG).hide();
            }
        }
    };

    ConfigPage.init = function () {
        _f.initPage();
    };
    ConfigPage.eventHandler = _eventHandler;
    return ConfigPage;
})(ConfigPage || {});

$(function () {
    ConfigPage.init();
})