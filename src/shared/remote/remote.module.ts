import { Module } from "@nestjs/common";
import { HttpService } from "./http.service";
import { UserService } from "./uc/user.service";

@Module({
  imports: [],
  providers: [
    UserService,
    HttpService,
  ],
  exports: [
    UserService
  ],
})
export class RemoteModule { }