//司機名稱
const drivers = [
    '朱晉廷','江明峰','江國銘','呂志偉','李佳憲','李明正','林日迴','林麒雄','吳孝豐','高自強',
    '莊羽鴻','莊智翔','郭政峰','陳政裕','陳麒任','楊文忠','鄭文豪','韓志華','黃信銨','黃聖文',
    '葉瑞煌','劉永富','石道純','朱鎮金','宋皇標','林豪群','洪基豪','高才述',
    '張立威','張家豪','張詠鈞','陳明光','陳朝舜','楊宗波','楊宗基','呂梅良','蕭麗鳳','熊勇力','旺家-分流倉'];

//產生隨機值(傳入長度int)
function randomWord(max){
    var str = "",
        arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    for(var i=0; i<max; i++){
        pos = Math.round(Math.random() * (arr.length-1));
        str += arr[pos];
    }
    return str;
}

//從Json Array內取特定key值，但又不會爆炸的function
//傳入(key與Json Array)
function getValueByKey(key, data) {
    for (i = 0; i < data.length; i++) {
        if (data[i] && data[i].hasOwnProperty(key)) {
            return data[i][key];
        }
    }
    return -1;
}

//用來判斷arr裡面是否有target的string
//傳入(被搜尋的array與string 目標)
function findObjInArray(arr, target) {
    var result = "";
    arr.some(
        function (v) {
            if (target.indexOf(v) > -1) {
                result = v;
            }
        }
    );
    return result;
}

//google認證登入用
function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    setCookie(1, "ID", profile.getEmail());
    setCookie(1, "name", profile.getName());
    window.location = "main.html";
    /*
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
    */
}

function setCookie(expire_days = 1, name = "", value = "") {
    expire_days = 1; // 過期日期(天)
    var d = new Date();
    d.setTime(d.getTime() + (expire_days * 24 * 60 * 60 * 1000));
    if (name.length > 0) {
        var value = name + "=" + value + "; ";
        var expires = "expires=" + d.toGMTString() + "; ";
        var domain = "domain=" + document.domain + "; "
        document.cookie = value + expires + domain + 'path=/';
    }
}

function deleteCookie(name = "", value = "") {
    if (document.cookie.indexOf(name) >= 0) {
        var expD = new Date();
        expD.setTime(expD.getTime() + (-1 * 24 * 60 * 60 * 1000));
        var uexpires = "expires=" + expD.toUTCString();
        document.cookie = name + "=" + value + "; " + uexpires;
    }
}

function getCookie(name = "") {
    name += "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('User signed out.');
    });
    deleteCookie("ID", getCookie("ID"));
    deleteCookie("name", getCookie("name"));
}

function getDataFromDB($http, API = "", callback) {
    $http({
            method: 'GET',
            url: API
        })
        .then(function successCallback(response) {
                if (response.status === 200) {
                    callback(response.data);
                } else {
                    alert('資料來源出錯! \n' + response.data);
                }
            },
            function errorCallback(response) {
                alert('伺服器錯誤! \n' + response.data);
            });
}

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