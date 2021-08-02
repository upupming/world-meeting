<template>
  <el-container>
    <el-header>
      <el-tooltip effect="light" placement="bottom">
        <template #content>
          <strong>Leohh的房间</strong>
          <table>
            <tbody>
              <tr>
                <td><span class="tooltip-light">房间号：</span></td>
                <td>
                  233 666 789
                  <i class="fa fa-copy"></i>
                </td>
              </tr>
              <tr>
                <td><span class="tooltip-light">主持人：</span></td>
                <td>李一鸣</td>
              </tr>
              <tr>
                <td><span class="tooltip-light">邀请链接：</span></td>
                <td>
                  https://bytemeet.com/invite/kusj2k3h4osdf
                  <i class="fa fa-copy"></i>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
        <i class="fa fa-info-circle"></i>
      </el-tooltip>
      <i class="fa fa-signal"></i>
      <i class="fa fa-navicon" style="float: right"></i>
    </el-header>
    <el-container>
      <el-main>
        <el-row justify="center">
          <VideoBlock :img-src="khPhoto" :is-active="true" />
          <VideoBlock :img-src="lymPhoto" :is-active="false" />
        </el-row>
        <el-row justify="center">
          <VideoBlock :img-src="crPhoto" :is-active="false" />
        </el-row>
      </el-main>
      <el-aside>
        <el-tabs type="border-card">
          <el-tab-pane label="聊天" name="first">
            <el-tooltip
              class="chat-others"
              effect="light"
              content="Hello world!"
              placement="right-end"
            >
              <el-avatar size="medium">Leo</el-avatar>
            </el-tooltip>
          </el-tab-pane>
          <el-tab-pane label="成员" name="second">配置管理</el-tab-pane>
        </el-tabs>
      </el-aside>
    </el-container>
    <el-footer>
      <el-row>
        <el-col :span="8">
          <el-row justify="start">
            <el-button type="text" class="btn-text">
              <i class="fa fa-microphone fa-lg" v-if="useMicrophone"></i>
              <i class="fa fa-microphone-slash fa-lg" v-else></i>
              <br />
              <div class="footer-desc">麦克风</div>
            </el-button>
            <el-button type="text" class="btn-text">
              <i class="fa fa-video-camera fa-lg" v-if="useCamera"></i>
              <br />
              <div class="footer-desc">摄像头</div>
            </el-button>
          </el-row>
        </el-col>
        <el-col :span="8">
          <el-row justify="center">
            <el-button type="text" class="btn-text">
              <i class="fa fa-user-plus fa-lg"></i>
              <br />
              <div class="footer-desc">成员</div>
            </el-button>
            <el-button type="text" class="btn-text">
              <i class="fa fa-wechat fa-lg"></i>
              <br />
              <div class="footer-desc">聊天</div>
            </el-button>
            <el-button type="text" class="btn-text">
              <i class="fa fa-share-square-o fa-lg"></i>
              <br />
              <div class="footer-desc">共享</div>
            </el-button>
            <el-button type="text" class="btn-text">
              <i class="fa fa-dot-circle-o fa-lg"></i>
              <br />
              <div class="footer-desc">录制</div>
            </el-button>
            <el-button type="text" class="btn-text">
              <i class="fa fa-ellipsis-h fa-lg"></i>
              <br />
              <div class="footer-desc">更多</div>
            </el-button>
          </el-row>
        </el-col>
        <el-col :span="8" justify="end">
          <el-row justify="end">
            <el-button type="text" class="btn-text">
              <i class="fa fa-stop-circle-o fa-lg"></i>
              <br />
              <div class="footer-desc">结束</div>
            </el-button>
          </el-row>
        </el-col>
      </el-row>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import VideoBlock from "../components/VideoBlock.vue";
import khPhoto from "../assets/kh.png";
import lymPhoto from "../assets/lym.png";
import crPhoto from "../assets/cr.png";

const useMicrophone = true;
const useCamera = true;
</script>

<style lang="less" scoped>
.el-main {
  flex-direction: column;
  display: flex;
  align-items: center;
  justify-content: center;
}
.el-header {
  height: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.el-footer {
  height: 55px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.el-aside {
  width: 20%;
  box-shadow: -8px 0 10px -8px rgba(0, 0, 0, 0.1);
}
.el-aside .el-tabs {
  height: 100%;
  z-index: -1;
}
.el-header i {
  margin-top: 7px;
  margin-right: 10px;
  cursor: pointer;
}
.btn-text {
  color: rgb(85, 85, 85);
  padding: 10px 15px;
}
.footer-desc {
  margin-top: 5px;
}
#icon-sidebar {
  float: right;
  margin-right: 0px;
}
.tooltip-light {
  color: grey;
}
table {
  margin-top: 5px;
}
table i {
  margin-left: 5px;
}
</style>
