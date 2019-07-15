
var _originalX = 0;
var _originalY = 0;

var _cellXNum = 80;
var _cellYNum = 50;

var _chartWidth = 1000;
var _chartHeight = 630;
var _magnetism = 15;//磁力


var circleR = 25;// 圆形半径
var rectWidth = 60;// 矩形长
var rectHeight = 40;// 矩形高

var drawMode = 'move';//模式  move移动  line连线 
var _paper = null;
var ifMouseDown = false;//检测是否鼠标按下,按下才能拖动
var ifCreate = false;  //是否创建

var arrNode = new Array() //节点集合
var arrAnchor = new Array() //锚点集合
var arrLine = new Array()  //线集合
var selectedNode;         //选中的节点
var selectedNodes = new Array();         //选中的节点 多选
var selectedLine;         //选中的线
var selectedAnchor;       //选中的锚点
var tempNode;             //临时节点,用于记录创建时选中的图形
var tempAnchor;           //临时锚点,用于记录鼠标最后移入的锚点
var multiple = false;   //是否多选



//监听Ctrl是否按下
window.document.onkeydown = function () {
    if (window.event.ctrlKey) {
        multiple = true;
    }
}
window.document.onkeyup = function () {
    if (!window.event.ctrlKey) {
        multiple = false;
    }
}

$(document).ready(function () {

    //绘制画布
    _paper = Raphael('ra', _chartWidth, _chartHeight);
    //桌布初始化
    initPaper();
    //初始化
    init();
});

function initPaper() {
    arrNode = new Array() //节点集合
    arrAnchor = new Array() //锚点集合
    arrLine = new Array()  //线集合
    selectedNode = null;         //选中的节点
    selectedLine = null;          //选中的线
    selectedAnchor = null;        //选中的锚点
    tempNode = null;              //临时节点,用于记录创建时选中的图形
    tempAnchor = null;            //临时锚点,用于记录鼠标最后移入的锚点
    _paper.clear();
    drawMarkLines(_paper);
}


// 绘制表格的所有参考线
function drawMarkLines(paper) {
    // 横线，Y坐标在变
    for (var i = 1; i < _cellYNum; i++) {
        var y = _originalY + (_chartHeight / _cellYNum) * i;
        drawMarkLine(paper, _originalX, y, (_originalX + _chartWidth), y);
    }
    // 竖线，X坐标在变
    for (var i = 1; i < _cellXNum; i++) {
        var x = _originalX + (_chartWidth / _cellXNum) * i;
        drawMarkLine(paper, x, _originalY, x, (_originalY + _chartHeight));
    }

}
// 绘制表格的单条参考线
function drawMarkLine(paper, x1, y1, x2, y2) {
    if ((0 == x1 && 0 == y1) || (0 == x2 && 0 == y2)) { } else {
        var line = paper.path("M" + x1 + " " + y1 + "L" + x2 + " " + y2);
        line.attr({
            stroke: "#C6C6C6"
        });
    }
}

//控件初始化
function init() {
    var imgbtn = $('.imgbtn');
    var ra = $('.ra');
    //禁止按钮图片拖动
    imgbtn.on('dragstart', function (e) {
        return false;
    });

    //图形按钮点击,创建控件前准备
    imgbtn.on('mousedown', function (e) {
        $('#helpContext').html('鼠标按下')
        moveNodeMode()//切换到移动模式
        ifMouseDown = true;
        ifCreate = true;  //选中图形 开始创建节点, 鼠标拖入画布后创建

        //缓存选中的图形按钮类型,用于拖动后创建
        tempNode = $(this).attr("form")
    })
    //在画布中移动
    ra.on('mousemove', function (e) {
        var tx = e.pageX - $('.ra').offset().left;
        var ty = e.pageY - $('.ra').offset().top;
        //$('#helpContext').html('鼠标 X:' + tx + ' Y:' + ty)
        //鼠标没有按下 ,不出发拖动事件
        if (ifMouseDown == false) return;

        //连接线模式
        if (drawMode == "line") {
            if (selectedAnchor == null) return;
            var path1 = getArr(selectedAnchor.attrs.cx, selectedAnchor.attrs.cy, tx, ty, 8);
            selectedLine.attr({ path: path1 });
            if (tempAnchor) {
                //磁条效果,增加易用性
                var scopex1 = tempAnchor.attrs.cx + _magnetism;
                var scopey1 = tempAnchor.attrs.cy + _magnetism;

                var scopex2 = tempAnchor.attrs.cx - _magnetism;
                var scopey2 = tempAnchor.attrs.cy - _magnetism;

                $('#helpContext').html(' tx ' + tx + ' ty ' + ty + ' scopex1 ' + scopex1 + ' scopex2 ' + scopex2 + ' scopey1 ' + scopey1 + ' scopey2 ' + scopey2)
                //超出一定范围后 释放临时锚点
                if (!(scopex1 > tx && scopex2 < tx && scopey1 > ty && scopey2 < ty)) {
                    tempAnchor.attr({ 'stroke': 'black', 'fill': 'white' });
                    tempAnchor = null;
                }
            }
        }
        //控件移动模式
        if (drawMode == "move") {
            if (tx < 0 || ty < 0) return;
            if (ifCreate) {
                //释放选中控件
                unSelectNode()
                //进入画布后,创建控件,创建后自动默认选中
                ifCreate = false;
                selectedNode = createNode(_paper, null, tempNode, tx, ty);
                selectedNode.attr('stroke', 'red');
                selectedNode.attr('fill', 'white');
                arrNode.push(selectedNode);
            } else {
                if (selectedNode == null) return;
                selectedNode.attr({
                    "x": tx,
                    "y": ty,
                    "cx": tx,
                    "cy": ty
                });
                NodeMoveLinkLine(selectedNode);
            }
        }
    })
    //鼠标在画布中释放
    ra.on('mouseup', function (e) {
        if (drawMode == "move") {
            ifMouseDown = false;
            ifCreate = false;
            if (selectedNode == null) return;
        }
        if (drawMode == "line") {
            if (tempAnchor != null) {
                var path1 = getArr(selectedAnchor.attrs.cx, selectedAnchor.attrs.cy, tempAnchor.attrs.cx, tempAnchor.attrs.cy, 8);
                selectedLine.attr({ path: path1 });
                selectedLine.data({ endId: tempAnchor.data().parentId, endType: tempAnchor.data().type });
                tempAnchor.attr({ 'stroke': 'black', 'fill': 'white' });
                arrLine.push(selectedLine);
                //将当前连线, 放入对应控件的开始数组中
                _paper.getById(selectedAnchor.data().parentId).data().starline.push(selectedLine);
                //将当前连线, 放入对应控件的结束数组中
                _paper.getById(tempAnchor.data().parentId).data().endline.push(selectedLine);

            } else {
                if (selectedLine) {
                    selectedLine.remove();
                }
            }
            if (selectedAnchor) {
                selectedAnchor.attr({ 'stroke': 'black', 'fill': 'white' });
            }
            unSelectNode();
            selectedAnchor = null;
            selectedLine = null;
            tempAnchor = null;
        }
    })
}
function NodeMoveLinkLine(node) {
    //起点在该节点的线
    for (var i = 0; i < node.data().starline.length; i++) {
        var line = node.data().starline[i];
        if (line.id == null) continue; //线条已删除
        //找到开始节点 对应锚点的坐标
        var start = getCoordinates(node, line.data().startType);
        //找到结束节点 对应锚点的坐标
        //_paper.getById(line.data().startId) //通过ID查找性能太慢 ,使用循环
        for (var n = 0; n < arrNode.length; n++) {
            if (line.data().endId == arrNode[n].id) {
                var end = getCoordinates(arrNode[n], line.data().endType)
                break;
            }
        }
        //移动线头
        var path1 = getArr(start.x, start.y, end.x, end.y, 8);
        line.attr({ path: path1 });

    }
    //结尾在该节点的线
    for (var i = 0; i < node.data().endline.length; i++) {
        var line = node.data().endline[i];
        if (line.id == null) continue; //线条已删除
        //找到结束节点 对应锚点的坐标
        var end = getCoordinates(node, line.data().endType);

        //找到开始节点 对应锚点的坐标
        //_paper.getById(line.data().startId) //通过ID查找性能太慢 ,使用循环
        for (var n = 0; n < arrNode.length; n++) {
            if (line.data().startId == arrNode[n].id) {
                start = getCoordinates(arrNode[n], line.data().startType)
                break;
            }
        }
        //移动线尾
        var path1 = getArr(start.x, start.y, end.x, end.y, 8);
        line.attr({ path: path1 });
    }
}


//创建锚点
function createAnchor(node) {
    if (node.id == null) return; // 节点不存在

    var top = getCoordinates(node, "top")
    var bottom = getCoordinates(node, "bottom")
    var left = getCoordinates(node, "left")
    var right = getCoordinates(node, "right")

    createAnchorPosition(node, top.x, top.y, 'top');
    createAnchorPosition(node, bottom.x, bottom.y, 'bottom');
    createAnchorPosition(node, left.x, left.y, 'left');
    createAnchorPosition(node, right.x, right.y, 'right');
}
//创建锚点
function createAnchorPosition(node, x, y, type) {
    var anchor = _paper.circle(x, y, 5).attr({ 'stroke': 'black', "cursor": "pointer", 'fill': 'white' });
    anchor.data({ parentId: node.id, type: type });
    anchor.toFront();//锚点置顶
    //添加锚点点击事件
    anchor.mousedown(function (e) {
        ifMouseDown = true;
        //释放选中控件
        unSelectNode()
        unSelectLine();
        //选择当前控件
        selectedAnchor = this;
        selectedAnchor.attr({ 'stroke': 'red', 'fill': 'red' });

        createLine(selectedAnchor.data().parentId, selectedAnchor.data().type, null, null, selectedAnchor.attrs.cx, selectedAnchor.attrs.cy, selectedAnchor.attrs.cx, selectedAnchor.attrs.cy)
    });

    anchor.mouseover(function (e) {
        if (selectedAnchor == null) return;
        if (selectedAnchor.id != this.id) {
            this.attr({ 'stroke': 'red', 'fill': 'red' });
            tempAnchor = this;
            $('#helpContext').html('移入' + tempAnchor.type + ' ' + tempAnchor.id);
        }
    });
    arrAnchor.push(anchor)
    return anchor
}
//创建线
/*
    startNodeId     起始节点ID 
    startNodeType   线条在起始节点位置
    endNodeId       结束节点ID 
    endNodeType     线条在结束节点位置 
    x1, y1          起点坐标
    x2, y2          终点坐标
*/
function createLine(startNodeId, startNodeType, endNodeId, endNodeType, x1, y1, x2, y2) {

    //获取线坐标
    var path1 = getArr(x1, y1, x2, y2, 8);

    //创建连线
    selectedLine = _paper.path(path1).attr({
        "stroke-width": 1
    });

    selectedLine.data({
        num: arrLine.length + 1,
        startId: startNodeId,
        startType: startNodeType,
        endId: endNodeId,
        endType: endNodeType,
        databox: {}
    });

    selectedLine.click(function (e) {
        if (drawMode == "line") return; //划线模式不可选择
        //释放选中控件
        //释放选中控件
        unSelectNode();
        unSelectLine();
        //选择当前控件
        selectedLine = this;
        selectedLine.attr('stroke', 'red');
    });
    return selectedLine;
}


//创建控件
function createNode(paper, id, type, x, y) {
    var Node;
    switch (type) {
        case "circle":
            Node = paper.circle(x, y, circleR).attr({
                "stroke-width": 2, title: arrNode.length + 1
            });
            break;
        case "rect":
            Node = paper.rect(x, y, rectWidth, rectHeight).attr({
                "stroke-width": 2, title: arrNode.length + 1
            });
            break;
    }

    if (id != null) {
        Node.id = id;
    } else {
        Node.id = "Node" + (Math.random() * 100000).toString();
    }
   

    Node.data({
        num: arrNode.length + 1,
        type: type,
        databox: {},
        starline: new Array(),
        endline: new Array(),
    });

    //因为需要拖动,所以使用鼠标按下,而不是鼠标点击事件
    Node.mousedown(function (e) {
        if (drawMode == "line") return; //划线模式不可选择
        ifMouseDown = true;
        if (!multiple) {
            //释放选中控件
            unSelectNode();
        }
        unSelectLine();
        //选择当前控件
        selectedNode = this;
        selectedNodes.push(this);
        selectedNode.attr('stroke', 'red');
    })
    return Node;
}

//计算节点各锚点坐标
function getCoordinates(node, type) {
    switch (node.type) {
        case "circle":
            var r = node.attrs.r;
            switch (type) {
                case "top":
                    return { x: node.attrs.cx, y: node.attrs.cy - r }
                case "bottom":
                    return { x: node.attrs.cx, y: node.attrs.cy + r }
                case "left":
                    return { x: node.attrs.cx - r, y: node.attrs.cy }
                case "right":
                    return { x: node.attrs.cx + r, y: node.attrs.cy }
            }
            break;
        case "rect":
            var width = node.attrs.width;
            var height = node.attrs.height;
            switch (type) {
                case "top":
                    return { x: node.attrs.cx + (width / 2), y: node.attrs.cy }
                case "bottom":
                    return { x: node.attrs.cx + (width / 2), y: node.attrs.cy + height }
                case "left":
                    return { x: node.attrs.cx, y: node.attrs.cy + (height / 2) }
                case "right":
                    return { x: node.attrs.cx + width, y: node.attrs.cy + (height / 2) }
            }
            break;
    }
}

//释放选中节点
function unSelectNode() {
    if (selectedNode != null) {
        selectedNode.attr('stroke', 'black');
        selectedNode = null;
    }


    selectedNodes.forEach(function (node) {
        node.attr('stroke', 'black');
    })
    selectedNodes = new Array();

}

//释放选中线
function unSelectLine() {
    if (selectedLine != null) {
        selectedLine.attr('stroke', 'black');
        selectedLine = null;
    }
}

//获取组成箭头的三条线段的路径
function getArr(x1, y1, x2, y2, size) {
    var angle = Raphael.angle(x1, y1, x2, y2); //得到两点之间的角度
    var a45 = Raphael.rad(angle - 45); //角度转换成弧度
    var a45m = Raphael.rad(angle + 45);
    var x2a = x2 + Math.cos(a45) * size;
    var y2a = y2 + Math.sin(a45) * size;
    var x2b = x2 + Math.cos(a45m) * size;
    var y2b = y2 + Math.sin(a45m) * size;
    var result = ["M", x1, y1, "L", x2, y2, "L", x2a, y2a, "M", x2, y2, "L", x2b, y2b];
    return result;
}

//开启连线模式
function drawLineMode() {
    if (drawMode == 'move') {
        drawMode = 'line';
        unSelectNode();
        //在控件上下左右画四个锚点
        //对锚点点添加拖动事件
        for (var i = 0; i < arrNode.length; i++) {
            createAnchor(arrNode[i]);
        }
    }
}

//开启移动模式
function moveNodeMode() {
    drawMode = 'move';
    unSelectNode();
    for (var i = 0; i < arrAnchor.length; i++) {
        arrAnchor[i].remove();
    }
}

//删除选中的节点
function deleteNode() {
    if (selectedNode != null) {
        //_paper.getById(selectedNode.id);
        var arrStarline = selectedNode.data().starline;
        var arrEndline = selectedNode.data().endline;
        arrStarline.forEach(function (line) {
            line.remove();
        });

        arrEndline.forEach(function (line) {
            line.remove();
        });
        selectedNode.remove();
        moveNodeMode()//切换到移动模式
    }
    if (selectedLine != null) {
        selectedLine.remove();
    }
}

//加载数据
function LoadData() {
    //初始化桌布
    initPaper();
    $.getJSON("data.json", function (data) {
        for (var i = 0; i < data.node.length; i++) {
            loadNode(data.node[i])
        }
        for (var i = 0; i < data.line.length; i++) {
            loadLine(data.line[i])
        }
        unSelectNode();
        unSelectLine();
    });

}

//加载节点
function loadNode(node) {
    var newNode = createNode(_paper, node.id, node.type, node.attrs.x, node.attrs.y)
    newNode.attr(node.attrs);
    newNode.data().databox = node.data;
    arrNode.push(newNode);
}

//加载线
function loadLine(line) {
    var startId = line.data.startId;
    var startType = line.data.startType;
    var endId = line.data.endId;
    var endType = line.data.endType;
    var newLine = createLine(startId, startType, endId, endType, 0, 0, 0, 0) //不加载坐标, 坐标在attr中直接赋值
    newLine.attr(line.attrs);
    newLine.data().databox = line.data.databox;
    _paper.getById(startId).data().starline.push(newLine);
    _paper.getById(endId).data().endline.push(newLine);
    arrLine.push(newLine);
}

//水平居中
function nodeCenter() {
    if (selectedNodes.length < 2) return;// 需选择2个以上
    //获取第一个节点的左锚点的Y坐标为基准
    var y = getCoordinates(selectedNodes[0], 'left').y;
    //从第2个节点开始循环
    for (var i = 1 ; i < selectedNodes.length; i++) {
        var node = selectedNodes[i];

        switch (node.type) {
            //圆形的坐标起点为中间点, 所以不需要计算
            case "circle":
                node.attr({
                    'x': node.attrs.x,
                    'y': y,
                    'cx': node.attrs.cx,
                    'cy': y
                });
                break;
                //矩形的坐标起点是左上角,所以需要计算得到中间高度 
            case "rect":
                node.attr({
                    'x': node.attrs.x,
                    'y': y - (node.attrs.height / 2),
                    'cx': node.attrs.cx,
                    'cy': y - (node.attrs.height / 2)
                });
                break;
        }
        NodeMoveLinkLine(node) //连接线联动
    }
}

//垂直居中
function nodeMiddle() {
    if (selectedNodes.length < 2) return;// 需选择2个以上
    //获取第一个节点的上锚点的X坐标为基准
    var x = getCoordinates(selectedNodes[0], 'top').x;
    //从第2个节点开始循环
    for (var i = 1 ; i < selectedNodes.length; i++) {
        var node = selectedNodes[i];
        switch (node.type) {
            //圆形的坐标起点为中间点, 所以不需要计算
            case "circle":
                node.attr({
                    'x': x,
                    'y': node.attrs.y,
                    'cx': x,
                    'cy': node.attrs.cy
                });
                break;
                //矩形的坐标起点是左上角,所以需要计算得到中间高度 
            case "rect":
                node.attr({
                    'x': x - (node.attrs.width / 2),
                    'y': node.attrs.y,
                    'cx': x - (node.attrs.width / 2),
                    'cy': node.attrs.cy
                });
                break;
        }
        NodeMoveLinkLine(node) //连接线联动
    }
}
//水平等距
function nodeWidthIsometry() {
    if (selectedNodes.length < 3) return;// 需选择3个以上
    //以最先选中的两个节点距离为标准
    //以前1节点右锚点X坐标和2节点的左锚点X坐标对比算出距离
    var x1 = getCoordinates(selectedNodes[0], 'right').x;
    var x2 = getCoordinates(selectedNodes[1], 'left').x;
    var distance = x2 - x1;//计算出距离

    //从第三个节点开始循环
    for (var i = 2 ; i < selectedNodes.length; i++) {
        var lastNode = selectedNodes[i - 1];//上一个节点
        var node = selectedNodes[i]; //当前节点 

        var calcX = getCoordinates(lastNode, 'right').x + distance;
        switch (node.type) {
            case "circle":
                //圆形的坐标起点为中间点,所以需要加上半径
                node.attr({
                    'x': calcX + node.attrs.r,
                    'y': node.attrs.y,
                    'cx': calcX + node.attrs.r,
                    'cy': node.attrs.cy
                });
                break;
                //矩形的坐标起点是左上角,不需额外计算
            case "rect":
                node.attr({
                    'x': calcX,
                    'y': node.attrs.y,
                    'cx': calcX,
                    'cy': node.attrs.cy
                });
                break;
        }
        NodeMoveLinkLine(node) //连接线联动
    }
}

//垂直等距
function nodeHeightIsometry() {
    if (selectedNodes.length < 3) return;// 需选择3个以上
    //以最先选中的两个节点距离为标准
    //以前1节点下锚点Y坐标和2节点的上锚点Y坐标对比算出距离

    var y1 = getCoordinates(selectedNodes[0], 'bottom').y;
    var y2 = getCoordinates(selectedNodes[1], 'top').y;
    var distance = y2 - y1;//计算出距离

    //从第三个节点开始循环
    for (var i = 2 ; i < selectedNodes.length; i++) {
        var lastNode = selectedNodes[i - 1];//上一个节点
        var node = selectedNodes[i]; //当前节点 
        var calcY = getCoordinates(lastNode, 'bottom').y + distance;
        switch (node.type) {
            case "circle":
                //圆形的坐标起点为中间点,需要加上半径
                node.attr({
                    'x': node.attrs.x,
                    'y': calcY + node.attrs.r,
                    'cx': node.attrs.cx,
                    'cy': calcY + node.attrs.r
                });
                break;
                //矩形的坐标起点是左上角,不需额外计算
            case "rect":
                node.attr({
                    'x': node.attrs.x,
                    'y': calcY,
                    'cx': node.attrs.cx,
                    'cy': calcY
                });
                break;
        }
        NodeMoveLinkLine(node) //连接线联动
    }
}

//显示结果
function showResult() {
    unSelectNode();
    unSelectLine();
    var sHtml;
    var result = new Object();
    result.node = new Array();
    result.line = new Array();
    for (var i = 0; i < arrNode.length; i++) {
        var itemNode = new Object();
        if (arrNode[i].id == null) continue; // 节点不存在
        itemNode.id = arrNode[i].id;
        itemNode.type = arrNode[i].type;
        itemNode.attrs = arrNode[i].attrs;
        itemNode.data = arrNode[i].data().databox;
        result.node.push(itemNode);
    }

    for (var i = 0; i < arrLine.length; i++) {
        var itemLine = new Object();
        if (arrLine[i].id == null) continue; // 线不存在
        itemLine.id = arrLine[i].id;
        itemLine.type = arrLine[i].type;
        itemLine.attrs = arrLine[i].attrs;
        itemLine.data = arrLine[i].getData();
        result.line.push(itemLine);
    }
    $('#helpContext').html(JSON.stringify(result));
}
