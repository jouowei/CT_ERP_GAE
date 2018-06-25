//改變網頁上各欄位可用性
function disableUI(boolDisable = false){
    $('textarea').prop('disabled', boolDisable);
    $("input[type=button]").prop("disabled", boolDisable);
    $("input[type=text]").prop("disabled", boolDisable);
    $("input[type=select]").prop("disabled", boolDisable);
    $("select").prop("disabled", boolDisable);
}

/**
 * Displays overlay with "Please wait" text. Based on bootstrap modal. Contains animated progress bar.
 */
function showPleaseWait(title="請稍後...") {
    var modalLoading = '<div class="modal" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false" role="dialog">\
        <div class="modal-dialog">\
            <div class="modal-content">\
                <div class="modal-header">\
                    <h4 class = "modal-title"> '+title+' </h4>\
                </div>\
                <div class="modal-body">\
                    <div class="progress">\
                      <div class="progress-bar progress-bar-success progress-bar-striped active" role="progressbar"\
                      aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width:100%; height: 40px">\
                      </div>\
                    </div>\
                </div>\
            </div>\
        </div>\
    </div>';
    $(document.body).append(modalLoading);
    $("#pleaseWaitDialog").modal("show");
}

/**
 * Hides "Please wait" overlay. See function showPleaseWait().
 */
function hidePleaseWait() {
    $("#pleaseWaitDialog").modal("hide");
}

//Modal版錯誤視窗
function showAlert($mdDialog, ev, title = "", content = "", ok = "確認") {
    $mdDialog.show(
        $mdDialog.alert()
        .parent(angular.element(document.body))
        .clickOutsideToClose(true)
        .title(title)
        .textContent(content)
        .ok(ok)
        .targetEvent(ev)
    );
};

//Modal版確認視窗 (目前有問題)
function showConfirm($mdDialog, ev, title = "", content = "", ok = "確認", cancel= "取消") {
    // Appending dialog to document.body to cover sidenav in docs app
    var confirm = $mdDialog.confirm()
        .title(title)
        .textContent(content)
        .targetEvent(ev)
        .ok(ok)
        .cancel(cancel);

    $mdDialog.show(confirm).then(
        function confirmCallback() {
            return true;
        },
        function cancelCallback() {
            return false;
        });
};