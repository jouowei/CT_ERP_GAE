	navbar = 
	'\
	<nav class="navbar navbar-expand-lg navbar-dark bg-dark">\
		<a class="navbar-brand" href="index.html"><img src="icon.png"  width="32px" height="32px" />駿騰物流填單系統</a>\
			<button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">\
			  <span class="navbar-toggler-icon"></span>\
			</button>  \
			<div class="collapse navbar-collapse" id="navbarSupportedContent">\
				<ul class="navbar-nav mr-auto">\
					<li class="nav-item active">\
					<a class="nav-link" href="index.html">首頁 <span class="sr-only">(current)</span></a>\
					</li>\
					<li class="nav-item dropdown">\
						<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
							市面物流出貨單\
						</a>\
						<div class="dropdown-menu" aria-labelledby="navbarDropdown">\
							<a class="dropdown-item" href="kuo.html">郭元益</a>\
							<a class="dropdown-item" href="lianhua.html">聯華</a>\
							<a class="dropdown-item" href="wangjia.html">旺家</a>\
							<div class="dropdown-divider"></div>\
							<a class="dropdown-item disabled" href="#">立信</a>\
							<a class="dropdown-item disabled" href="#">信可</a>\
							<a class="dropdown-item disabled" href="#">森永</a>\
							<a class="dropdown-item disabled" href="#">掬水軒</a>\
							<a class="dropdown-item disabled" href="#">華元</a>\
							<a class="dropdown-item disabled" href="#">芮程</a>\
							<a class="dropdown-item disabled" href="#">中祥</a>\
						</div>\
					</li>\
					<li class="nav-item dropdown">\
						<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
						南北物流\
						</a>\
						<div class="dropdown-menu disabled" aria-labelledby="navbarDropdown">\
						<a class="dropdown-item disabled" href="#">聯華</a>\
						<div class="dropdown-divider"></div>\
						<a class="dropdown-item disabled" href="#">Something else here</a>\
						</div>\
					</li>\
					<li class="nav-item dropdown">\
						<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
						報表\
						</a>\
						<div class="dropdown-menu" aria-labelledby="navbarDropdown">\
						<a class="dropdown-item" href="#">郭元益</a>\
						<a class="dropdown-item" href="#">聯華</a>\
						<a class="dropdown-item" href="#">旺家</a>\
					</li>\
				< /ul>\
			</div>\
	</nav>';
	document.write(navbar);
	//檢查登入狀態，沒有登入就退回index.html
	const userID = getCookie("ID");
	if (userID.length == 0) {
		window.location = "/";
	}
    